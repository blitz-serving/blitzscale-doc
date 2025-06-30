# Server
通过MPI多机/单机内启动之后，首先初始化MPI和CUDA设备，之后初始化用于处理grpc请求的Stub，初始化Tokenizer和gRPC serviceImpl，将service注册处理的stub并开始监听服务。监听之前注册sig_handler,接收到SIGINT等信号之后调用回调函数，通知poller线程终止server监听
在Stub初始化时初始化相应的模型、CacheManager和MigrationManager、ModelLoader和Activation_manager、zigzag_manager并初始化NCCLBroadcastor
## Tccl
在Server中，所有的网络发送(params,kv_cache)都通过TcclSend完成

## Model
初始化flashinfer的handler，并分配weight_segment，runtime_segment，以及ragged_indptr_d等小的内存区域
对所有的子层(embed,transformer,和lm都进行初始化)

## CacheManager
分配kvcache的GPU区域和cpu区域
## MigrationManager
在这里通过cudaEventCreateWithFlags创建CUDA事件，用于在GPU上进行异步操作的计时和同步

## ModelLoader
分配host内存

## ActivationManager
分配num_activation_slot * activation_slot_size_in_bytes大小的区域存放activation
创建新的线程，循环等到被唤醒，进行

## ZigzagManager
创建线程循环等待唤醒，并调度task进行执行。 执行时首先判断执行到的层数，如果未执行，则执行prologue，由embed层进行前向推理
之后forward后续的层，如果执行了最后一层则执行epilogue从task_queue中移除。

## NcclBcastor
创建线程绑定nccl_bcastor_worker_inner任务
设置线程使用的GPU设备，确保后续CUDA/NCCL操作在正确的GPU上执行，然后初始化点对点的P2P通信
当唤醒时，通过普通的链式广播/环式广播并行广播，提升带宽利用率。并统计广播的耗时和带宽

export CUDA_VISIBLE_DEVICES="0,1"
