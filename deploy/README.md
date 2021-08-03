# Deploy Method and Tool


## Setup Tool
### Makecert
https://github.com/FiloSottile/mkcert
```
    brew install mkcert
```

### VirtualBox
https://www.virtualbox.org/wiki/Downloads

### Vagrant
https://www.vagrantup.com/downloads
```
    brew tap hashicorp/tap
    brew install vagrant
```

### Krew
https://krew.sigs.k8s.io/docs/user-guide/setup/install/

### SSHPASS
```
    brew install hudochenkov/sshpass/sshpass
```

### Terraform
https://www.terraform.io/downloads.html
```
    brew install terraform
```

## Setup 

### Vagrant up
```
    cd ./deploy
    vagrant up
    cd ..
```

### /etc/hosts
Update /etc/hosts with this configuration
```
    192.168.50.4    grafana.microk8s.local
    192.168.50.4    argocd.microk8s.local
    192.168.50.4    app.microk8s.local
```

### Link kubectl and ssh to cluster
Use the default id_rsa key for the ssh key auth (passphrase will be ask if needed)
```
    ./deploy/setup.sh
```
