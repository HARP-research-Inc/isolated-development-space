# <img src="https://static.wixstatic.com/media/355b75_1c4e29d87f1e449cbdfdb2b623ac66ce~mv2.png/v1/fill/w_292,h_72,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/355b75_1c4e29d87f1e449cbdfdb2b623ac66ce~mv2.png" width="100"> research, Inc. - **Isolated Development Space**

This repository serves as a Helm chart containing a template for deploying a (mostly) isolated development space inside of a Kubernetes cluster. Each instance of the development space is designed to be run on a specific node in the cluster, and comes with a DinD Docker Daemon and a [VSCode CLI Tunnel Server](https://github.com/HARP-research-Inc/vscode-cli-tunnel-docker) that allows connecting to the development space from Visual Studio Code. The development space is designed to work on systems without an open port, and will work on clusters behind NAT/CGNAT as well as firewalled cloud clusters. THe development space will persist both Docker data and the workspace data.

For the end user, the workspace will have a common `/vscode` directory that is shared between the VSCode Tunnel and the DinD instance so that bind mounts inside of the `/vscode` directory work as expected. The home directory has also been mapped to `/vscode` so that the user can persist binaries and configuration like shell environments.

## How to Install

The Helm repo needs to be added first. To add the Helm repo, run:

```bash
helm repo add isolated-development-space https://harp-research-inc.github.io/isolated-development-space/
```

### Quickstart

If you want to run the workspace on the current node you're installing the Helm repo on, and would like the workspace to share the user's name & all data live inside a `workspace-data` folder on the user's home directory,

```bash
USER_DIRECTORY=~/workspace-data
USER_NAME="$USER"
TARGET_HOSTNAME="$(kubectl get nodes -o json | jq -r '.items[] | select(.status.nodeInfo.machineID == "'"$(cat /etc/machine-id)"'") | .metadata.labels["kubernetes.io/hostname"]')"
mkdir -p "$USER_DIRECTORY/certs" "$USER_DIRECTORY/data" "$USER_DIRECTORY/docker"
helm install "$USER_NAME-workspace" \
  --namespace "$USER_NAME-workspace" \
  --create-namespace \
  --set name="$USER_NAME" \
  --set dataDirectories.certs="$USER_DIRECTORY/certs" \
  --set dataDirectories.data="$USER_DIRECTORY/data" \
  --set dataDirectories.dockerData="$USER_DIRECTORY/docker" \
  --set targetHostname="$TARGET_HOSTNAME" \
  isolated-development-space/isolated-development-space
```

## Configuration

The list of values are:

<!-- add-values-table-here-start -->

| Value Name | Description | Required | Default Value |
|:---:|:---:|:---:|:---:|
| `dataDirectories` | An object containing keys for the various data paths. | Yes | - |
| `dataDirectories.certs` | The directory containing the TLS certificates that the Docker client and server will use to communicate. | Yes | - |
| `dataDirectories.data` | The directory containing the actual user workspace data. This is what will get mounted into `/vscode`. | Yes | - |
| `dataDirectories.dockerData` | The directory containg the Docker daemon data. This will be used to preserve any built/pulled images and container data. If you do not care about preserving Docker images between restarts, you can mount this to `/tmp` or another tmpfs directory. | Yes | - |
| `image` | An object containing keys for the Docker image and tag to use for the workspace. | No | - |
| `image.image` | The repository of the Docker image to use for the workspace. | No | `ghcr.io/harp-research-inc/vscode-cli-tunnel-docker` |
| `image.tag` | The tag of the Docker image to use for the workspace. | No | `<appVersion>-full-dev` |
| `name` | The name of the workspace. | No | `user-workspace` |
| `storage` | How much storage to reserve for the different data directories | No | - |
| `storage.certs` | The amount of storage to reserve for the certs directory. | No | `10Mi` |
| `storage.data` | The amount of storage to reserve for the data directory. | No | `10Gi` |
| `storage.dockerData` | The amount of storage to reserve for the dockerData directory. | No | `10Gi` |
| `targetHostname` | The hostname of the kubernetes node that will run the workspace. The hostname is the `kubernetes.io/hostname` label for the node. | Yes | - |

### Example `values.yaml`

#### Minimal `values.yaml`

```yaml
dataDirectories: 
  certs: "/path/to/certs"
  data: "/path/to/data"
  dockerData: "/path/to/docker-data"
targetHostname: "my-node-hostname"
```

#### Full `values.yaml`

```yaml
dataDirectories: 
  certs: "/path/to/certs"
  data: "/path/to/data"
  dockerData: "/path/to/docker-data"
image: 
  image: "ghcr.io/harp-research-inc/vscode-cli-tunnel-docker"
  tag: "<appVersion>-full-dev"
name: "user-workspace"
storage: 
  certs: "10Mi"
  data: "10Gi"
  dockerData: "10Gi"
targetHostname: "my-node-hostname"
```

<!-- add-values-table-here-end -->

${\color{grey}\textsf{Copyright © 2024 HARP research, Inc. Visit us at }}$ [https://harpresearch.ai](https://harpresearch.ai)
