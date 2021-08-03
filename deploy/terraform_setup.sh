#!/usr/bin/env bash

set -ex

crt_path="$(pwd)/deploy/tmp/rootCA.pem"
key_path="$(pwd)/deploy/tmp/rootCA-key.pem"

terraform -chdir=./deploy/terraform init 

terraform -chdir=./deploy/terraform plan\
    -var="certmanager_crt_path=${crt_path}" \
    -var="certmanager_key_path=${key_path}"

terraform -chdir=./deploy/terraform apply \
    -var="certmanager_crt_path=${crt_path}" \
    -var="certmanager_key_path=${key_path}"
