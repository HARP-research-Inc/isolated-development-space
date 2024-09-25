#!/bin/sh

# Get out dir
OUTDIR=$1
# If not provided, prompt for it
if [ -z "$OUTDIR" ]; then
  read -p "Enter output directory: " OUTDIR
fi

mkdir -p "$OUTDIR"/ca "$OUTDIR"/server "$OUTDIR"/client
cd "$OUTDIR"

openssl genrsa -out ca-pkey.pem 4096
openssl req -subj "/C=US/ST=New York/L=Troy/O=HARP Research/OU=Infra/CN=docker/emailAddress=cert@localhost" -new -x509 -days 9999 -key ca-pkey.pem -sha256 -out ca.pem
openssl genrsa -out server-pkey.pem 4096
openssl req -subj "/CN=docker" -sha256 -new -key server-pkey.pem -out server.csr
echo "subjectAltName = DNS:docker,IP:127.0.0.1" >> extfile.cnf
echo extendedKeyUsage = serverAuth >> extfile.cnf
openssl x509 -req -days 9999 -sha256 -in server.csr -CA ca.pem -CAkey ca-pkey.pem -CAcreateserial -out server-cert.pem -extfile extfile.cnf
openssl genrsa -out client-key.pem 4096
openssl req -subj '/CN=client' -new -key client-key.pem -out client.csr
echo extendedKeyUsage = clientAuth > extfile-client.cnf
openssl x509 -req -days 9999 -sha256 -in client.csr -CA ca.pem -CAkey ca-pkey.pem \
  -CAcreateserial -out client-cert.pem -extfile extfile-client.cnf
rm client.csr server.csr extfile.cnf extfile-client.cnf ca.srl

mv ca-pkey.pem ca/key.pem
cp ca.pem ca/cert.pem

mv server-pkey.pem server/key.pem
mv server-cert.pem server/cert.pem
cp ca.pem server/ca.pem

mv client-key.pem client/key.pem
mv client-cert.pem client/cert.pem
cp ca.pem client/ca.pem

rm ca.pem
