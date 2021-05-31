# Deep Liver Segmentation 

## Description 
Web-based liver segmentation provides all the standard features of a medical image viewer. Users are able to interact with DICOM series and segmentation masks. In addition to the normal segmentation mask creation, they can use the machine learning model to produce predicted segmentation masks for a series.
## Authors
- Catharina Castillo 
- Samuel Becerra Martinez
- Leo Fabian Martinez-Perez
- Mitchell Sibal



## Structure
This repository is set up to faciliate the independent development of the two
aspects of the liver segmetation web app. The webapp and machine learning
aspects are stored within their own folder. They will be eventually joined
together into one folder as we determine their interactions.

```bash
.                               # Will be updated as we proceed with the project
│   ├── 
├── webapp 
│   ├── Viewers                 # The first iteration of the DICOM image viewer, forked from OHIF
│   ├── BLDViewer               # Banana Leaf Dev. implementation using cornerstone and dcmjs libraries
│   ├── 
│   ├── 
│   └── 
│
├── machinelearning
│   ├── Couinaud_Annotation_Data
|       └── Couinaud_Annotation_Data
|           └── data_splits_raw                       #Raw data with corresponding train/test/validate splits (.nii format)
|               └── training
|                   ├── couinaud_raw ...
|                   └── img_raw      ...
|               └── testing
|                   ├── couinaud_raw ...
|                   └── img_raw      ...
|               └── validate
|                   ├── couinaud_raw ...
|                   └── img_raw      ...
|           ├── model_notebooks
|               └── CompleteDataSet
|                   ├── 2-Models_0-4 and 0,5-8
|                   ├── 4-Models_0-2,3-4,5-6,7-8
|                   ├── 0527_04_51                                  #Model's weights
|                   ├── HounsfieldRange_Comparisons.ipynb 
|                   ├── MultipleModels_DifferentBatchSize-1000_1000RESIZE_192INITfeat32.ipynb       #Training Multiple Models  
|                   └── partitionExploration.ipynb 
|           ├── unet_architecture
|               └── unet.py
|           ├── data_preprocessing.ipynb
|           └── helpers.py 
│   ├── SeriesToSeg.py         # Converting a DICOM series to a Seg
└── README.md                  # This file
```
