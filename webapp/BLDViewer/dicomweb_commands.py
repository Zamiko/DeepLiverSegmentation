# Copyright 2018 Google LLC All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import json
import os

#FIXME: If we want to use the approach of linking a python script for the purposes of the dicomwebstandard, we'd have to deal with the permissions
#I do not know if we can accomplish this without a virtual env
#On the other hand, I think there's instructions on how to deal with this issue in the even that you're using flask,
#so if we ultiamtely have to switch to that I don't expect it to be much trouble
from google.auth.transport import requests
from google.oauth2 import service_account

_BASE_URL = "https://healthcare.googleapis.com/v1"


def get_session():
    """Creates an authorized Requests Session."""
    credentials = service_account.Credentials.from_service_account_file(
        filename=os.environ["GOOGLE_APPLICATION_CREDENTIALS"],
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )

    # Create a requests Session object with the credentials.
    session = requests.AuthorizedSession(credentials)
    return session


def dicomweb_store_instance(
    base_url, project_id, cloud_region, dataset_id, dicom_store_id, dcm_file
):
    """Handles the POST requests specified in the DICOMweb standard."""
    url = "{}/projects/{}/locations/{}".format(base_url, project_id, cloud_region)

    dicomweb_path = "{}/datasets/{}/dicomStores/{}/dicomWeb/studies".format(
        url, dataset_id, dicom_store_id
    )

    # Make an authenticated API request
    session = get_session()

    with open(dcm_file, "rb") as dcm:
        dcm_content = dcm.read()

    content_type = "application/dicom"
    headers = {"Content-Type": content_type}

    response = session.post(dicomweb_path, data=dcm_content, headers=headers)
    response.raise_for_status()
    print("Stored DICOM instance:")
    print(response.text)
    return response


def dicomweb_search_instance(
    base_url, project_id, cloud_region, dataset_id, dicom_store_id
):
    """Handles the GET requests specified in DICOMweb standard."""
    url = "{}/projects/{}/locations/{}".format(base_url, project_id, cloud_region)

    dicomweb_path = "{}/datasets/{}/dicomStores/{}/dicomWeb/instances".format(
        url, dataset_id, dicom_store_id
    )

    # Make an authenticated API request
    session = get_session()

    headers = {"Content-Type": "application/dicom+json; charset=utf-8"}

    response = session.get(dicomweb_path, headers=headers)
    response.raise_for_status()

    instances = response.json()

    print("Instances:")
    print(json.dumps(instances, indent=2))

    return instances


def dicomweb_retrieve_study(
    base_url, project_id, cloud_region, dataset_id, dicom_store_id, study_uid
):
    """Handles the GET requests specified in the DICOMweb standard."""
    url = "{}/projects/{}/locations/{}".format(base_url, project_id, cloud_region)

    dicomweb_path = "{}/datasets/{}/dicomStores/{}/dicomWeb/studies/{}".format(
        url, dataset_id, dicom_store_id, study_uid
    )

    # When specifying the output file, use an extension like ".multipart."
    # Then, parse the downloaded multipart file to get each individual
    # DICOM file.
    file_name = "study.multipart"

    # Make an authenticated API request
    session = get_session()

    response = session.get(dicomweb_path)

    response.raise_for_status()

    with open(file_name, "wb") as f:
        f.write(response.content)
        print("Retrieved study and saved to {} in current directory".format(file_name))

    return response

#Don't know if we'll need this
def dicomweb_delete_study(
    base_url, project_id, cloud_region, dataset_id, dicom_store_id, study_uid
):
    """Handles DELETE requests equivalent to the GET requests specified in
    the WADO-RS standard.
    """
    url = "{}/projects/{}/locations/{}".format(base_url, project_id, cloud_region)

    dicomweb_path = "{}/datasets/{}/dicomStores/{}/dicomWeb/studies/{}".format(
        url, dataset_id, dicom_store_id, study_uid
    )

    # Make an authenticated API request
    session = get_session()

    headers = {"Content-Type": "application/dicom+json; charset=utf-8"}

    response = session.delete(dicomweb_path, headers=headers)
    response.raise_for_status()

    print("Deleted study.")

    return response


def main():
    print("connected to file")


if __name__ == "__main__":
    main()