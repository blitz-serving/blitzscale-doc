# Build
## hardware requirement
为了充分展示不同扩缩容方案的特点，需要有
1. RDMA IB网卡
2. NVLink

仓库目录下提供了Dockerfile容器环境，避免手动配置环境的复杂性
## clone项目
```bash
git clone git@github.com:blitz-serving/blitz-remake.git
cd blitz-remake
```

## 构建容器
```bash
docker build -t blitz-docker .

# 运行容器时指定使用的IB网卡
# 指定容器使用全部GPU
# 建议将刚刚clone的blitz-remake仓库通过volume挂载到容器中
docker run -itd \
    --privileged \
    --gpus all \
    --ipc host \
    --network host \
    --volume /data2:/nvme \
    --device /dev/infiniband/rdma_cm \
    --device /dev/infiniband/uverbs0 \
    --workdir /root \
    --name blitz-docker \
    blitz-docker /bin/bash
```
## 安装rust
```bash
## 安装rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "/root/.cargo/env"

```

## 编译构建
对于不同架构的GPU，需要更改cmake编译选项，以4090、Hopper架构GPU各自的cmake命令为例
```bash
# 4090 使用CUDA_ARCHITECTURES=80,TORCH_CUDA_ARCH_LIST='8.0'
cmake -Bbuild/release \
-DTorch_DIR=/usr/local/lib/python3.10/dist-packages/torch \
-DBUILD_MODE=debug \
-DCMAKE_CUDA_ARCHITECTURES=80 \
-DFLASHINFER_CUDA_ARCHITECTURES=80 \
-DTORCH_CUDA_ARCH_LIST='8.0' \
-DFLASHINFER_ENABLE_FP8=false \
-DFLASHINFER_GEN_HEAD_DIMS=128 \
-DFLASHINFER_GEN_MASK_MODES=1 \
-DFLASHINFER_GEN_POS_ENCODING_MODES=1 

# Hopper架构下修改对应的ARCHITECTURES
cmake -Bbuild/release \
-DTorch_DIR=/usr/local/lib/python3.10/dist-packages/torch \
-DBUILD_MODE=debug \
-DCMAKE_CUDA_ARCHITECTURES=90 \
-DFLASHINFER_CUDA_ARCHITECTURES=90 \
-DTORCH_CUDA_ARCH_LIST='9.0' \
-DFLASHINFER_ENABLE_FP8=false \
-DFLASHINFER_GEN_HEAD_DIMS=128 \
-DFLASHINFER_GEN_MASK_MODES=1 \
-DFLASHINFER_GEN_POS_ENCODING_MODES=1 

# 若提示CMAKE_CUDA_COMPILER并未找到，则需要提供nvcc路径
# -DCMAKE_CUDA_COMPILER=/usr/local/cuda/bin/nvcc \

# 编译
cmake --build build/release -j 64
```
## mpi

如果构建时报错无法找到mpirun，使用如下命令
```bash
export OPAL_PREFIX=/opt/hpcx/ompi                 
export PATH=/opt/hpcx/ompi/bin:$PATH
export LD_LIBRARY_PATH=/opt/hpcx/ompi/lib:\
/opt/hpcx/ucx/lib:/opt/hpcx/ucc/lib:\
/opt/hpcx/sharp/lib:/opt/hpcx/hcoll/lib:$LD_LIBRARY_PATH
```

## 测试
```bash
# 通过test_model_llama测试CUDA能够正常使用
./build/bin/test_model_llama
```



## usage
启动server和router之后，由client向router发送推理请求，接口兼容openai

```bash
pip install toml
python ./scripts/batchv2/main.py --template ./config/e2e...
```