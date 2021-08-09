#!/usr/bin/env bash

set -e

crt_path="$(pwd)/deploy/tmp/rootCA.pem"
key_path="$(pwd)/deploy/tmp/rootCA-key.pem"
argo_pass=$(htpasswd -nbBC 10 "" $ARGO_ADMIN_PASSWORD | tr -d ':\n' | sed 's/$2y/$2a/')

terraform -chdir=./deploy/terraform init 

# terraform -chdir=./deploy/terraform plan\
#     -var="certmanager_crt_path=${crt_path}" \
#     -var="certmanager_key_path=${key_path}" \
#     -var="argo_pass=${argo_pass}"

terraform -chdir=./deploy/terraform apply \
    -var="certmanager_crt_path=${crt_path}" \
    -var="certmanager_key_path=${key_path}" \
    -var="argo_pass=${argo_pass}"
