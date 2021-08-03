
resource "helm_release" "cert_manager" {
  depends_on = []
  name       = "cert-manager"
  repository = "https://charts.jetstack.io"
  chart      = "cert-manager"
  version    = "1.4.1"
  timeout    = 3000

  create_namespace = true
  namespace = "certmanager-system"

  set {
    name = "installCRDs"
    value = "true"
  }

}

resource "kubernetes_secret" "certmanager_secret" {
    depends_on = [helm_release.cert_manager]
    type = "generic"
    
    metadata {
        name = "certmanager-ca-secret"
        namespace = "certmanager-system"
    }

    data = {
        "tls.crt" = file(var.certmanager_crt_path)
        "tls.key" = file(var.certmanager_key_path)
    }
}

data "template_file" "certmanager_issuer" {
  template = file("./template/certmanager_issuer_template.tmpl")
  vars = { 
   }
}

resource "null_resource" "certmanager_issuer" {
    depends_on = [helm_release.cert_manager, kubernetes_secret.certmanager_secret]
    provisioner "local-exec" {
        command = <<EOT
        echo "${data.template_file.certmanager_issuer.rendered}" | kubectl apply -f -
        EOT
    }
}