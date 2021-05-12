"""" Transform a liver DICOM series to a Couinaud annotated DICOM segmentation
using an automated segmentation algorithm""""

# Authored by Leo Martinez-Perez
# Course: UC Davis ECS193 2020-2021
# Team Name: Banana Leaf Development

# Dependencies
import nibabel as nib
import numpy as np
import SimpleITK as sitk
import pydicom
import pydicom_seg
from tensorflow.keras.models import load_model
import tensorflow as tf
import dicom2nifti
import matplotlib.pyplot as plt
import math
import cv2
import os

# Helper Functions
# Change orientation of the input matrix
def matrixflip(m,d):
    myl = np.array(m)
    if d=='v':
        return np.flip(myl, axis=0)
    elif d=='h':
        return np.flip(myl, axis=1)

# Normalize image
def normalizeImageIntensityRange(img):
  img[img < HOUNSFIELD_MIN] = HOUNSFIELD_MIN
  img[img > HOUNSFIELD_MAX] = HOUNSFIELD_MAX
  return (img - HOUNSFIELD_MIN) / HOUNSFIELD_RANGE

# Shrink the images
def Scale_Images(imgTarget):
  scaled_images = []

  for i in range(0,imgTarget.shape[0]):
    img = imgTarget[i,:,:]
    img = np.uint8(img * 255)
    img = matrixflip(img,'v')
    scaled_images.append(cv2.resize(img, IMG_SIZE, interpolation = cv2.INTER_LINEAR))

  #Convert list to array
  scaled_images = np.array(scaled_images)
  scaled_images = np.expand_dims(scaled_images, axis=3)
  return scaled_images

def Scale_to_Original(imgs):
  scaled_images = []

  for i in range(0,imgs.shape[0]):
    img = imgs[i,:,:]
    img = np.uint8(img)
    scaled_images.append(cv2.resize(img, OG_IMG_SIZE, interpolation = cv2.INTER_LINEAR))

  #Convert list to array
  scaled_images = np.array(scaled_images)
  scaled_images = np.expand_dims(scaled_images, axis=3)

  return scaled_images

# Constants
# Metainfo generated from http://qiicr.org/dcmqi/#/seg
metainfo = '/content/drive/Shareddrives/Banana Leaf Development/Data/DICOM_Data/metainfo.json' # TODO: Modify metainfo.json according to the needs of the user
series_path = '/content/drive/Shareddrives/Banana Leaf Development/Data/DICOM_Data/DICOM_anon/'
model_path = '/content/drive/Shareddrives/Banana Leaf Development/Data/Couinaud_Annotation_Data/models/All_Slices/0502_2:40pm/'
seriesNii_path = '/content/drive/Shareddrives/Banana Leaf Development/Data/DICOM_Data/ABDPANC.nii'
predNii_path = '/content/drive/Shareddrives/Banana Leaf Development/Data/DICOM_Data/pred.nii'
DICOM_seg_path = '/content/drive/Shareddrives/Banana Leaf Development/Data/DICOM_Data/segmentation.dcm'

# Image variables
IMAGE_HEIGHT = int(512/4)
IMAGE_WIDTH = int(512/4)
IMG_SIZE = (IMAGE_HEIGHT, IMAGE_WIDTH)

#Original Image size
OG_IMAGE_HEIGHT = 512
OG_IMAGE_WIDTH = 512
OG_IMG_SIZE = (OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH)

# Image normalization
HOUNSFIELD_MIN = -1000
HOUNSFIELD_MAX = 1000
HOUNSFIELD_RANGE = HOUNSFIELD_MAX - HOUNSFIELD_MIN

# Generate variables of the source images
dicom_series_paths = os.listdir(series_path)
dicom_series_paths_new = [os.path.join(series, x) for x in dicom_series_paths]
source_images = [
    pydicom.dcmread(x, stop_before_pixels=True)
    for x in dicom_series_paths_new
]

# Create and save a nifti volume of the DICOM series
dicom2nifti.dicom_series_to_nifti(series_path, seriesNii_path)

# Transpose the input series matrix to the correct orientation
# TODO: Modify this so that it flips it to the correct orientation for any input orientation
img_slice_transposed = matrixflip(img_slice,'v')

# Load the series and the model
model = load_model(model_path)
niiFile = nib.load(seriesNii_path)

# Generate the segmentation of the DICOM series

# Data Preprocessing
imgTarget = nib.load(seriesNii).get_fdata()
imgTarget = normalizeImageIntensityRange(imgTarget)
imgTarget = np.transpose(imgTarget,(2,0,1))
scaled_images = Scale_Images(imgTarget)

# Predicting the segmentation masks
mask_predicted = model.predict(scaled_images)
mask_pred_argmax=np.argmax(mask_predicted, axis=3) #Convert the probability into a max value within the area
scale_up_images = Scale_to_Original(mask_pred_argmax)
scale_up_images = scale_up_images[:,:,:,0]
scale_up_images_transposed = np.transpose(scale_up_images,(1,2,0))

#Flip images back to original oriention
for i in range(0,scale_up_images_transposed.shape[2]):
  img = scale_up_images_transposed[:,:,i]
  scale_up_images_transposed[:,:,i] = matrixflip(img,'v')

# Convert the predicted volume to Niftii format such that it can be transformed to an SimpleITK image
 predImg = nib.Nifti1Image(scale_up_images_transposed, affine=np.eye(4))

# Write a multi-class segmentation DICOM seg file
template = pydicom_seg.template.from_dcmqi_metainfo(metainfo)
writer = pydicom_seg.MultiClassWriter(
    template = template,
   inplane_cropping = False,
    skip_empty_slices = False,
    skip_missing_segment=True,
)

# Write the DICOM Seg and modify some attributes Manually
dcm = writer.write(segmentation, source_images)
dcm.SharedFunctionalGroupsSequence[0].PlaneOrientationSequence[0].ImageOrientationPatient = source_images[0].ImageOrientationPatient
dcm.SharedFunctionalGroupsSequence[0].PixelMeasuresSequence[0].SliceThickness = source_images[0].SliceThickness
dcm.SharedFunctionalGroupsSequence[0].PixelMeasuresSequence[0].PixelSpacing = source_images[0].PixelSpacing

# Include the referenced series sequence attributes manually
dcm.ReferencedSeriesSequence = Sequence([Dataset()])
temp = [Dataset() for x in range(len(source_images))] # Create list of datasets with length equal to amount of slices
dcm.ReferencedSeriesSequence[0].ReferencedInstanceSequence = Sequence(temp)
dcm.ReferencedSeriesSequence[0].SeriesInstanceUID = pydicom.uid.UID(source_images[0].SeriesInstanceUID)
for i in range(len(source_images)):
  classUID = source_images[i].SOPClassUID
  instanceUID = source_images[i].SOPInstanceUID
  dcm.ReferencedSeriesSequence[0].ReferencedInstanceSequence[i].ReferencedSOPClassUID = pydicom.uid.UID(classUID)
  dcm.ReferencedSeriesSequence[0].ReferencedInstanceSequence[i].ReferencedSOPInstanceUID = pydicom.uid.UID(instanceUID)
 
# ClinicalTrialTImePoint Variables not always accessible in original DICOM series
try:
  dcm.ClinicalTrialTimePointDescription = source_images[0].ClinicalTrialTimePointDescription
  dcm.ClinicalTrialTimePointID = source_images[0].ClinicalTrialTimePointID
  dcm.ClinicalTrialSeriesID = source_images[0].ClinicalTrialSeriesID # TODO: Connect this to "PatientName"
except:
  print("TODO: Log error")

# Save the DICOM Segmentation to local directory
dcm.save_as(DICOM_seg_path)
