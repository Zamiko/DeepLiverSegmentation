#Helper Functions
import matplotlib.pyplot as plt
import tensorflow as tf
import os, glob
import cv2
from tqdm.notebook import tqdm
import numpy as np
from sys import getsizeof

def display(display_list, title_list, figure_size =(15,15)):
  plt.figure(figsize = figure_size)

  for i in range(len(display_list)):
    plt.subplot(1, len(display_list), i+1)
    plt.title(title_list[i])
    plt.imshow(tf.keras.preprocessing.image.array_to_img(display_list[i]), cmap = 'Greys_r')
  plt.show()


def load_data(path, isPNG, resize=True, NEW_IMG_SIZE = (128,128)):
	#Capture data as a list
	data = []

	if isPNG:
		data_dir  = path  + '*.png'
	else:
		data_dir = path + '*.tif'

	for index, img_path in tqdm(enumerate(sorted(glob.iglob(data_dir)))):
		#substring = img_path[-5:]
	  	img = cv2.imread(img_path, 0) 

	  	if resize:      
	  		data.append(cv2.resize(img, NEW_IMG_SIZE, interpolation = cv2.INTER_NEAREST))
	  	else:
	  		data.append(img)

	#Convert list to array 
	data = np.array(data)

	print("Dimmensions: ", data.shape)
	print("Data Type  : ", type(data[0,0,0]))
	print("Size in MB : ", round(getsizeof(data) /1024/1024 ,2)) #Divice again by 1024 to get GB
	print("\n")

	return data

def plot_train_hist(history, plt_loss=True, plt_acc=False, plt_mean_iou=False):
	#plot the training and validation accuracy and loss at each epoch

	######### LOSS AND VAL LOSS #########
	if plt_loss:
		loss = history.history['loss']
		val_loss = history.history['val_loss']
		epochs = range(1, len(loss) + 1)
		plt.plot(epochs, loss, 'g', label='Training loss')
		plt.plot(epochs, val_loss, 'r', label='Validation loss')
		#plt.vlines(11, 0, 0.14, colors = 'b', linestyles = 'dashed', label='Saved Best Model') # We can see from the training history above that
		                                                      # best model was saved at epoch 5
		plt.title('Training and validation loss')
		plt.xlabel('Epochs')
		plt.ylabel('Loss')
		plt.legend()
		plt.grid(linestyle='-')
		plt.show()


	######### ACC and VAL ACC #########
	if plt_acc:
		acc = history.history['accuracy']
		val_acc = history.history['val_accuracy']
		plt.plot(epochs, acc, 'g', label='Training Accuracy')
		plt.plot(epochs, val_acc, 'r', label='Validation Accuracy')
		#plt.vlines(11, 0.76, 1, colors = 'b', linestyles = 'dashed', label='Saved Best Model') # We can see from the training history above that
		                                                      # best model was saved at epoch 5
		plt.title('Training and validation Accuracy')
		plt.xlabel('Epochs')
		plt.ylabel('Accuracy')
		plt.legend()
		plt.grid(linestyle='-')
		plt.show()   

	######### MEAN_IOU and VAL MEAN_IOU #########
	if plt_mean_iou:
		mean_iou = history.history['mean_io_u']
		val_mean_iou = history.history['val_mean_io_u']
		plt.plot(epochs, mean_iou, 'g', label='Training Mean IOU')
		plt.plot(epochs, val_mean_iou, 'r', label='Validation Mean IOU')
		plt.title('Training and validation Mean IOU')
		plt.xlabel('Epochs')
		plt.ylabel('Mean IOU')
		plt.legend()
		plt.grid(linestyle='-')
		plt.show()   


def calculateClassIOU(cm, num_classes=9):
  #: IOU = true_positive / (true_positive + false_positive + false_negative)
  #cm: confusion matrix where rows are actual and cols are predicted 
  values = []
  for i in range(0,num_classes):
    trueP = cm[i,i]
    falseP = 0
    falseN = 0

    for col in range(0,num_classes):
      if (i != col):
        falseP = falseP + cm[i,col]

    for row in range(0,num_classes):
      if (i != row):
        falseN = falseN + cm[row,i]

    IoU = trueP / (trueP + falseP + falseN)
    values.append(IoU)
    print("IoU for class,",i, " is: ", IoU)

  return values
