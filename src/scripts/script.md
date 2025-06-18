# Scripts
**batchv2是当前的使用脚本，batch目录中的脚本已经deprecated**

***
## Args
* templates 
  * default: none
  * 指定template file的路径
* checkpoint 
  * default: none
  * 指定到archive home的路径
* force 
  * default: False
  * 是否忽略checkpoint
* dry-run
  * default: false
  * 不执行任何实例的运行脚本
* color 
  * default: False
  * 是否启用颜色化的输出

其中templates和checkpoint至少需要指定一个，否则无法运行


template中的配置可以参考`/config`目录下的toml配置文件
如下以e2e-blitz.toml为例
```toml
[global]
num_gpus_per_node = 4
cuda_devices = [0, 1, 2, 3, 4, 5, 6, 7]

[selection]
models = ["llama3_8b"]
features = ["blitz_ultra"]
datasets = ["AzureConv2023-5min"]

[server]
ibv_rate = 100
inter_node = true

[server.config]
g0001 = "10.254.0.10"
g0002 = "10.254.0.9"

[router]
port = 11236
max_prefill_num = 13
max_decode_num = 13
min_prefill_num = 1
min_decode_num = 1

prefill_lower_bound = 0.5
prefill_upper_bound = 0.8
decode_lower_bound = 0.75
decode_upper_bound = 0.95
migration_lower_bound = 0.2
migration_upper_bound = 0.4
scale_down_threshold_millis = 333

mock_load_millis = 0
mock_transfer_millis = 0

# Extra envs when launching server, router and client.
# CUDA_VISIBLE_DEVICES is set in [global] section and will be ignored if set here.
[extra-envs]
LOG_LEVEL = "INFO"

[features]
sllm_cache_replace = "ngrok,impl_sllm,cache_replace"
sllm_optimal = "ngrok,impl_sllm,cache_all_hit,mutate"
blitz_ultra = "ngrok,impl_blitz,impl_live_pro,impl_fast_pro,mutate"

blitz_tanz_debug = "ngrok,impl_blitz,impl_fast_pro"
blitz_live_tanz_debug = "ngrok,impl_blitz,impl_live_pro,impl_fast_pro"

[datasets]

[datasets.AzureCode2023-90sec]
dataset_path = "./dataset_home/AzureCode2023-90sec.csv"
time_in_secs = 20

[datasets.AzureCode2023-130sec]
dataset_path = "./dataset_home/AzureCode2023-130sec.csv"
time_in_secs = 20

[datasets.AzureConv2023-5min]
dataset_path = "./dataset_home/AzureConv2023-5min.csv"
time_in_secs = 150

[models]

[models.llama2_7b]
model_path = "/nvme/blitz/models/Llama-2-7b-hf"
tokenizer = "/nvme/blitz/models/Llama-2-7b-hf/tokenizer.json"
tokens_prefilled_per_sec = 13000
tokens_transferred_per_sec = 30000
num_hidden_layers = 32
num_available_blocks = 8000
tp_size = 1

[models.llama3_8b]
model_path = "/nvme/huggingface/models/DeepSeek-R1-Distill-Llama-8B"
tokenizer = "/nvme/huggingface/models/DeepSeek-R1-Distill-Llama-8B/tokenizer.json"
tokens_prefilled_per_sec = 12000
tokens_transferred_per_sec = 60000
num_hidden_layers = 32
num_available_blocks = 30000
tp_size = 1

[models.mistral_24b]
model_path = "/nvme/huggingface/models/Mistral-Small-24B-Instruct-2501"
tokenizer = "/nvme/huggingface/models/Mistral-Small-24B-Instruct-2501/tokenizer.json"
tokens_prefilled_per_sec = 6000
tokens_transferred_per_sec = 40000
num_hidden_layers = 40
num_available_blocks = 8000
tp_size = 2

[models.qwen_72b]
model_path = "/nvme/huggingface/models/models--Qwen--Qwen2.5-72B-Instruct/snapshots/495f39366efef23836d0cfae4fbe635880d2be31"
tokenizer = "/nvme/huggingface/models/models--Qwen--Qwen2.5-72B-Instruct/snapshots/495f39366efef23836d0cfae4fbe635880d2be31/tokenizer.json"
tokens_prefilled_per_sec = 7500
tokens_transferred_per_sec = 40000
num_hidden_layers = 80
num_available_blocks = 8000
tp_size = 8
```
## Control Flow
指定template时，将template文件中的配置通过instantiate_template函数进行解析，读取模板中的配置项

`selection`中指定models、features、datasets(lists)，其中对每个model的详细配置在`[models]`中指定，包括`model_path`、`tokenizer`、`tokens_prefilled_per_sec`、`tokens_transferred_per_sec`等
对所有model的详细配置与datasets的详细配置、features的详细配置进行组合，与router的配置一同传入`instantiate_template_router`，得到用于实例化的router配置

run_instances中
首先启动server和server_monitor(监控),启动完毕启动router和client，并等待client正常退出