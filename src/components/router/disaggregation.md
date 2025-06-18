# Disaggregation
## 请求处理
`start_disaggregation_event_loop`函数创建loop处理不同逻辑的Task
## Main loops
通过Tokio异步运行时Spawn出不同的loop进行请求处理、metrics监控等关键逻辑
### auto_scale_event_loop
### reject_kv_cache_event_loop
### report_network_flow
### report_system_flow
### report_cur_waiting_prefill_tokens
### disaggregation_event_loop_inner
对于每个replica，创建出处理当前replica的event_loop。传入
1. 用于同步的init_guard
2. 状态切换命令的ReplicaCommand Channel
3. queue
4. migration queue
5. replica_metric


在循环中每次取出当前replica状态，根据状态执行不同的行为执行不同的处理逻辑
#### inactive/loadingprefill/loadingdecode
yield等待
#### shuttingnull
yield等待
#### decode
循环从migration_queue中try_consume batch(tokens batch entries)并压入global_batch。如果没global_batch已经为空则yield释放，否则进行一次Decode
包括对系统metric进行设置，将batch和last_token通过stub发送给后端(decode_v2)，将generations进行top_tokens取样后通过stream sender发送。如果是最后一个token返回InferStreamResponse::End,否则返回InferStreamResponse::Intermediate，接收者会进行不同的处理。当前loop会在请求生成最后一个token时从entries中移除该请求。之后将结束的请求clear_cache,未结束的请求filter_batch并重新放入global_batch，进行下一轮处理
#### prefill
如果当前需求的block已经大于每个replica最大的block数，则yield
否则从queue中调用next_batch得到下一个prefill batch，增加使用的blocks计数，构造PrefillCase::Normal的prefillRequest，调用stub.prefill_v2得到prefill的Response，发送InferStreamResponse::PrefillDone & InferStreamReponse::Intermediate | InferStreamResponse::End,并判断client是否quit，如果由于client quit或Response::End则从entries中移除，并根据移除情况进行clear_cache / filter_batch
由于是PD分离，将Prefill的结果构造为MigrationBatch，通过flow_watcher和migration_queue进行传递(batch entries tokens),交由Decode实例进行Decode阶段
#### newprefill(TODO)
用于ZigZag执行的前半段
#### refactoryprefill
#### oldprefill
用于ZigZag执行的后半段
#### mutatingtodecode
#### auspreflil
#### ausdecode
#### shuttingdecode
#### shuttingprefill
#### sending/loading/casting
panic
## 扩缩容
通过状态机进行状态的切换