---
tags:
  - devops
  - iac
  - terraform
title: Terraform
---

## Концепция Infrastructure as Code

Infrastructure as Code (IaC) - подход к управлению инфраструктурой, при котором серверы, сети, базы данных и прочие ресурсы описываются в виде кода, хранятся в системе контроля версий и проходят те же процессы ревью, что и прикладной код.

Ключевые принципы IaC:

- Декларативность - описываем желаемое состояние, а не последовательность действий. Terraform сам определяет, какие изменения нужны для достижения цели
- Идемпотентность - повторное применение одной и той же конфигурации не приводит к побочным эффектам. Если ресурс уже существует в нужном состоянии, Terraform ничего не делает
- Версионируемость - вся инфраструктура живёт в Git, можно откатиться на любую предыдущую версию
- Воспроизводимость - одна и та же конфигурация создаёт идентичные окружения в разных регионах, аккаунтах или облаках

### Terraform vs другие инструменты

| Критерий | Terraform | Ansible | Pulumi | CloudFormation |
|----------|-----------|---------|--------|----------------|
| Подход | Декларативный | Процедурный/Декларативный | Декларативный | Декларативный |
| Язык | HCL | YAML | Go, Python, TS | JSON/YAML |
| Состояние | State file | Без состояния | State file | Stack state |
| Облака | Multi-cloud | Multi-cloud | Multi-cloud | Только AWS |
| Фокус | Инфраструктура | Конфигурация | Инфраструктура | Инфраструктура |

> [!summary]
> Terraform занимает нишу оркестрации инфраструктуры. Ansible лучше подходит для конфигурации серверов. Часто их используют вместе: Terraform создаёт VM, Ansible настраивает софт внутри.

---

## Архитектура Terraform

Terraform состоит из нескольких ключевых компонентов:

- Terraform Core - движок, который читает конфигурацию, строит граф зависимостей, вычисляет план изменений и применяет их
- Providers - плагины для взаимодействия с API облачных провайдеров и платформ
- State - файл состояния, хранящий маппинг между ресурсами в конфигурации и реальными объектами в инфраструктуре

### Цикл Plan/Apply

```
terraform init    → загрузка провайдеров и модулей
terraform plan    → сравнение конфигурации с текущим state
terraform apply   → применение изменений к инфраструктуре
terraform destroy → удаление всех ресурсов из конфигурации
```

На этапе `plan` Terraform строит направленный ациклический граф (DAG) всех ресурсов, определяет зависимости и вычисляет порядок создания/обновления/удаления. Ресурсы без зависимостей создаются параллельно.

> [!important]
> Всегда проверяй вывод `terraform plan` перед apply. В CI/CD пайплайне plan запускается на этапе MR, apply - только после approve.

---

## HCL синтаксис

### Resources и Data Sources

```hcl
# Resource - управляемый объект инфраструктуры
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id

  tags = { Name = "web-server", Environment = "production" }
}

# Data Source - чтение существующих ресурсов
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  owners = ["099720109477"]
}

resource "aws_instance" "web" {
  ami = data.aws_ami.ubuntu.id
}
```

### Variables

Три типа переменных: input, output и local.

```hcl
# Input - параметры извне
variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "allowed_cidrs" {
  type    = list(string)
  default = ["10.0.0.0/8"]
}

variable "tags" {
  type    = map(string)
  default = { ManagedBy = "terraform" }
}

# Output - экспортируемые значения
output "instance_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.web.public_ip
}

output "database_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}

# Local - вычисляемые промежуточные значения
locals {
  name_prefix   = "${var.project_name}-${var.environment}"
  is_production = var.environment == "production"
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

Способы передачи input значений по приоритету: `-var` флаг, `-var-file`, `*.auto.tfvars`, `terraform.tfvars`, переменные окружения `TF_VAR_<name>`, значение `default`.

### Типы данных и Expressions

```hcl
# Примитивные: string, number, bool
# Коллекции: list(string), set(string), map(string)
# Структурные: object({ name = string, port = number }), tuple([string, number])

# Условные выражения
instance_type = var.environment == "production" ? "m5.xlarge" : "t3.micro"

# Splat expressions
instance_ids = aws_instance.web[*].id

# For expressions
upper_names = [for name in var.names : upper(name)]
filtered    = [for s in var.list : s if s != ""]
name_map    = { for s in var.list : s => upper(s) }

# Heredoc
user_data = <<-EOF
  #!/bin/bash
  echo "Hello from ${var.environment}"
EOF
```

---

## Провайдеры

Провайдеры - плагины для взаимодействия с API конкретных платформ:

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"    # >= 5.0.0, < 6.0.0
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
  default_tags {
    tags = { ManagedBy = "terraform", Project = var.project_name }
  }
}

# Несколько инстансов через alias
provider "aws" {
  alias  = "us_east"
  region = "us-east-1"
}

resource "aws_acm_certificate" "cert" {
  provider    = aws.us_east
  domain_name = "example.com"
}
```

> [!info]
> Файл `.terraform.lock.hcl` фиксирует точные версии провайдеров. Его нужно коммитить в Git, чтобы вся команда использовала одинаковые версии.

### null_resource и terraform_data

```hcl
# Устаревший подход (до 1.4)
resource "null_resource" "run_script" {
  triggers = { script_hash = filemd5("${path.module}/scripts/setup.sh") }
  provisioner "local-exec" { command = "bash ${path.module}/scripts/setup.sh" }
}

# Современный подход (Terraform 1.4+)
resource "terraform_data" "run_script" {
  triggers_replace = [filemd5("${path.module}/scripts/setup.sh")]
  provisioner "local-exec" { command = "bash ${path.module}/scripts/setup.sh" }
}
```

---

## State Management

**State file** - JSON-файл с маппингом ресурсов Terraform на реальные объекты в облаке. Без state Terraform не знает, какими ресурсами управляет.

### Remote Backend

```hcl
# S3 + DynamoDB (AWS)
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "production/vpc/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# Terraform Cloud
terraform {
  cloud {
    organization = "mycompany"
    workspaces { name = "production-vpc" }
  }
}
```

Инфраструктура для S3 backend:

```hcl
resource "aws_s3_bucket" "terraform_state" {
  bucket = "mycompany-terraform-state"
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "aws:kms" }
  }
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute { name = "LockID"; type = "S" }
}
```

> [!important]
> State содержит чувствительные данные в открытом виде. Всегда включай шифрование и ограничивай доступ к bucket.

### Команды для работы с State

```bash
terraform state list                    # Список ресурсов
terraform state show aws_instance.web   # Детали ресурса
terraform state mv aws_instance.web aws_instance.app  # Переименование
terraform state rm aws_instance.web     # Удаление из state (ресурс остаётся)
terraform state pull > backup.tfstate   # Скачать state
terraform state push backup.tfstate     # Загрузить state
terraform force-unlock <LOCK_ID>        # Снять зависшую блокировку
```

### Import ресурсов

```bash
# CLI способ
terraform import aws_instance.web i-1234567890abcdef0
```

```hcl
# Import block (Terraform 1.5+)
import {
  to = aws_instance.web
  id = "i-1234567890abcdef0"
}
```

```bash
# Генерация конфигурации из импорта
terraform plan -generate-config-out=generated.tf
```

---

## Модули

Модули - основной механизм повторного использования инфраструктуры. Каждая директория с `.tf` файлами - модуль.

### Структура модуля

```
modules/vpc/
  main.tf          # Основные ресурсы
  variables.tf     # Input переменные
  outputs.tf       # Output значения
  versions.tf      # Требования к провайдерам
```

### Создание и использование

```hcl
# modules/vpc/variables.tf
variable "name" { type = string }
variable "cidr" { type = string; default = "10.0.0.0/16" }
variable "azs" { type = list(string) }
variable "private_subnets" { type = list(string) }
variable "public_subnets" { type = list(string) }

# modules/vpc/main.tf
resource "aws_vpc" "this" {
  cidr_block           = var.cidr
  enable_dns_hostnames = true
  tags = { Name = var.name }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnets)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "${var.name}-public-${var.azs[count.index]}" }
}

# modules/vpc/outputs.tf
output "vpc_id" { value = aws_vpc.this.id }
output "public_subnet_ids" { value = aws_subnet.public[*].id }
```

### Источники модулей

```hcl
# Локальный модуль
module "vpc" { source = "./modules/vpc" }

# Terraform Registry (всегда пиннить версию)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
}

# Git с тегом
module "vpc" {
  source = "git::https://github.com/company/modules.git//vpc?ref=v1.2.0"
}
```

> [!info]
> Всегда указывай `version` для модулей из Registry и `ref` для модулей из Git. Без пиннинга версий обновление модуля может сломать инфраструктуру.

---

## Workspaces

Workspaces позволяют использовать одну конфигурацию для нескольких окружений с разным state:

```bash
terraform workspace new staging
terraform workspace select staging
terraform workspace list
terraform workspace show
```

```hcl
locals {
  environment = terraform.workspace
  instance_type = {
    dev = "t3.micro", staging = "t3.small", production = "m5.large"
  }
}

resource "aws_instance" "web" {
  instance_type = local.instance_type[local.environment]
  tags = { Environment = local.environment }
}
```

> [!important]
> Workspaces подходят для простых сценариев. Для сложных окружений с разным набором ресурсов лучше использовать отдельные директории или Terragrunt. Проблема workspaces - один backend для всех окружений, что усложняет управление доступом.

---

## Lifecycle Rules

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  lifecycle {
    create_before_destroy = true   # Zero-downtime: новый до удаления старого
    prevent_destroy       = true   # Защита от terraform destroy
    ignore_changes        = [ami, tags["LastModified"]]  # Игнорировать внешние изменения
  }
}

resource "aws_instance" "app" {
  lifecycle {
    # Пересоздать при изменении триггера (Terraform 1.2+)
    replace_triggered_by = [terraform_data.replacement.output]
  }
}

# Precondition и Postcondition
resource "aws_instance" "web" {
  instance_type = var.instance_type

  lifecycle {
    precondition {
      condition     = data.aws_ami.selected.architecture == "x86_64"
      error_message = "AMI must be x86_64 architecture."
    }
    postcondition {
      condition     = self.public_ip != ""
      error_message = "Instance must have a public IP."
    }
  }
}
```

---

## Provisioners

Provisioners выполняют действия на ресурсе после создания. HashiCorp считает их крайней мерой:

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  provisioner "remote-exec" {
    inline = ["sudo apt-get update -y", "sudo apt-get install -y nginx"]
    connection {
      type = "ssh"; user = "ubuntu"
      private_key = file("~/.ssh/deployer"); host = self.public_ip
    }
  }

  provisioner "local-exec" {
    command = "echo ${self.public_ip} >> inventory.txt"
  }

  provisioner "local-exec" {
    when    = destroy
    command = "echo 'Destroyed ${self.id}' >> destroy.log"
  }
}
```

> [!important]
> Вместо provisioners используй cloud-init/user_data для настройки VM, Packer для создания образов, Ansible для конфигурации. Provisioners не отслеживаются в state и не идемпотентны.

---

## Terraform Functions

Проверить функции можно в `terraform console`.

```hcl
# Файлы
user_data = file("${path.module}/scripts/init.sh")
user_data = templatefile("${path.module}/init.sh.tftpl", { db_host = aws_db_instance.main.address })
etag      = filemd5("${path.module}/files/index.html")

# Коллекции
instance_type = lookup(var.instance_types, var.environment, "t3.micro")
tags          = merge(local.common_tags, { Name = "web" })
all_cidrs     = flatten([var.private_cidrs, var.public_cidrs])
all_subnets   = concat(var.public_subnets, var.private_subnets)
unique_azs    = distinct(var.availability_zones)

# Сетевые
subnet_cidr    = cidrsubnet("10.0.0.0/16", 8, 1)    # 10.0.1.0/24
private_subnets = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 1)]

# Обработка ошибок
instance_type = try(var.overrides[var.environment], "t3.micro")
has_override  = can(var.overrides[var.environment])

# Строки
name      = format("%s-%s-%03d", var.project, var.env, count.index + 1)
sanitized = replace(var.name, "/[^a-zA-Z0-9-]/", "")

# Кодирование
json_string = jsonencode({ key = "value" })
parsed      = jsondecode(file("${path.module}/config.json"))
yaml_parsed = yamldecode(file("${path.module}/config.yaml"))
encoded     = base64encode("hello")
```

---

## Dynamic Blocks и for_each vs count

### Dynamic Blocks

```hcl
variable "ingress_rules" {
  type = list(object({
    port = number, protocol = string, cidr_blocks = list(string), description = string
  }))
}

resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }
}
```

### count vs for_each

```hcl
# count - по индексу. Удаление элемента из середины пересоздаёт последующие
resource "aws_instance" "web" {
  count         = var.instance_count
  instance_type = "t3.micro"
  tags = { Name = "web-${count.index + 1}" }
}

# for_each - по ключу. Удаление элемента не влияет на остальные
resource "aws_instance" "web" {
  for_each      = toset(["web-1", "web-2", "web-3"])
  instance_type = "t3.micro"
  tags = { Name = each.key }
}

# for_each с map объектов
resource "aws_instance" "app" {
  for_each      = var.instances   # map(object({...}))
  ami           = each.value.ami
  instance_type = each.value.instance_type
  tags = { Name = each.key }
}
```

> [!summary]
> Используй `for_each` в большинстве случаев. `count` подходит для условного создания (`count = var.enabled ? 1 : 0`) или абсолютно идентичных ресурсов.

---

## Moved Blocks и Import Blocks

```hcl
# Переименование без пересоздания
moved {
  from = aws_instance.web
  to   = aws_instance.app_server
}

# Перемещение в модуль
moved {
  from = aws_instance.web
  to   = module.compute.aws_instance.web
}

# Переход с count на for_each
moved {
  from = aws_instance.web[0]
  to   = aws_instance.web["primary"]
}

# Декларативный импорт (Terraform 1.5+)
import {
  to = aws_s3_bucket.assets
  id = "my-existing-bucket"
}

# Импорт с for_each
import {
  for_each = var.existing_buckets
  to       = aws_s3_bucket.buckets[each.key]
  id       = each.value
}
```

---

## Terragrunt

**Terragrunt** - обёртка над Terraform, решающая проблемы дублирования конфигурации.

### Структура проекта

```
infra/
  terragrunt.hcl              # Корневой: backend, provider
  environments/
    dev/
      env.hcl
      vpc/terragrunt.hcl
      eks/terragrunt.hcl
    production/
      env.hcl
      vpc/terragrunt.hcl
      eks/terragrunt.hcl
  modules/
    vpc/
    eks/
```

### Конфигурация

```hcl
# infra/terragrunt.hcl - корневой
remote_state {
  backend = "s3"
  generate = { path = "backend.tf", if_exists = "overwrite_terragrunt" }
  config = {
    bucket         = "mycompany-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# environments/production/vpc/terragrunt.hcl
include "root" { path = find_in_parent_folders() }

locals {
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

terraform { source = "../../../modules/vpc" }
inputs = {
  name = "${local.env_vars.locals.environment}-vpc"
  cidr = "10.0.0.0/16"
}

# Зависимости между модулями
dependency "vpc" {
  config_path = "../vpc"
  mock_outputs = { vpc_id = "vpc-mock", private_subnet_ids = ["subnet-mock"] }
}

inputs = {
  vpc_id     = dependency.vpc.outputs.vpc_id
  subnet_ids = dependency.vpc.outputs.private_subnet_ids
}
```

```bash
terragrunt run-all plan       # Plan для всех модулей
terragrunt run-all apply      # Apply с учётом зависимостей
terragrunt graph-dependencies # Граф зависимостей
```

---

## CI/CD интеграция

### GitHub Actions

```yaml
name: Terraform
on:
  pull_request:
    paths: ['infra/**']
  push:
    branches: [main]
    paths: ['infra/**']

permissions:
  contents: read
  pull-requests: write
  id-token: write

jobs:
  plan:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: "1.7.0" }
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/terraform-ci
          aws-region: eu-west-1
      - run: terraform init && terraform validate && terraform fmt -check
        working-directory: infra/environments/production
      - id: plan
        run: terraform plan -no-color
        working-directory: infra/environments/production
      - uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner, repo: context.repo.repo,
              body: '#### Terraform Plan\n```\n${{ steps.plan.outputs.stdout }}\n```'
            });

  apply:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: "1.7.0" }
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/terraform-ci
          aws-region: eu-west-1
      - run: terraform init && terraform apply -auto-approve
        working-directory: infra/environments/production
```

### Atlantis

Self-hosted приложение для автоматизации Terraform через pull requests. Автоматически запускает `plan` при открытии PR и публикует результат в комментарии. `apply` - по команде `atlantis apply` после approve:

```yaml
# atlantis.yaml
version: 3
projects:
  - name: production-vpc
    dir: infra/environments/production/vpc
    autoplan:
      when_modified: ["*.tf", "*.tfvars"]
      enabled: true
    apply_requirements: [approved, mergeable]
```

---

## Best Practices

### Структура проекта

```
# По компонентам (крупные проекты) - отдельный state, меньший blast radius
infra/
  modules/
    vpc/
    eks/
  network/        # VPC, subnets
    main.tf
    backend.tf
  compute/        # EKS, ASG
    main.tf
    backend.tf
  data/           # RDS, S3
    main.tf
    backend.tf

# По окружениям (небольшие проекты)
infra/
  modules/
  environments/
    dev/terraform.tfvars
    staging/terraform.tfvars
    production/terraform.tfvars
```

### Naming и Tagging

```hcl
# snake_case для всех идентификаторов
resource "aws_instance" "api_server" {}     # Хорошо
resource "aws_instance" "instance1" {}      # Плохо

# Стандартные файлы модуля
# main.tf, variables.tf, outputs.tf, versions.tf, data.tf, locals.tf

# Tagging через default_tags
provider "aws" {
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
      CostCenter  = var.cost_center
    }
  }
}
```

### Версионирование и безопасность

```
# .terraform-version (tfenv) или .tool-versions (asdf)
1.7.0
```

- Никогда не храни секреты в `.tf` или `.tfvars`
- `sensitive = true` для переменных с секретами
- OIDC для аутентификации CI/CD вместо статических ключей
- Минимальные IAM permissions для Terraform

### Линтинг и валидация

```bash
terraform fmt -recursive          # Форматирование
terraform validate                # Валидация синтаксиса
tflint --recursive                # Расширенный линтер
trivy config .                    # Сканирование безопасности
checkov -d .                      # Compliance checks
terraform-docs markdown table .   # Генерация документации
```

---

## OpenTofu

**OpenTofu** - open-source форк Terraform от Linux Foundation, созданный после смены лицензии HashiCorp на BSL.

Ключевые отличия:

- Лицензия MPL 2.0 - полностью открытая
- Обратная совместимость с Terraform 1.5.x
- State encryption из коробки на стороне клиента
- Поддержка переменных в backend и provider блоках

Выбирай OpenTofu, если компания не может использовать BSL лицензию, нужно client-side шифрование state, или есть принципиальное предпочтение open-source. Оставайся на Terraform при использовании Terraform Cloud и необходимости официальной поддержки HashiCorp.

```bash
brew install opentofu
tofu init && tofu plan && tofu apply   # CLI совместим
```

---

## Практический пример: VPC + EKS + RDS

Production-ready инфраструктура на AWS с готовыми модулями из Registry:

```hcl
# versions.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws        = { source = "hashicorp/aws", version = "~> 5.40" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.27" }
    helm       = { source = "hashicorp/helm", version = "~> 2.12" }
  }
  backend "s3" {
    bucket = "mycompany-terraform-state"
    key    = "production/main/terraform.tfstate"
    region = "eu-west-1"; encrypt = true; dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { Environment = var.environment, Project = var.project_name, ManagedBy = "terraform" }
  }
}

locals {
  name             = "${var.project_name}-${var.environment}"
  azs              = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets  = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 1)]
  public_subnets   = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 101)]
  database_subnets = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 201)]
}

# ─── VPC ──────────────────────────────────────────
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"

  name = local.name; cidr = var.vpc_cidr; azs = local.azs
  private_subnets  = local.private_subnets
  public_subnets   = local.public_subnets
  database_subnets = local.database_subnets

  enable_nat_gateway           = true
  single_nat_gateway           = false
  enable_dns_hostnames         = true
  create_database_subnet_group = true

  public_subnet_tags = {
    "kubernetes.io/role/elb"                    = 1
    "kubernetes.io/cluster/${local.name}-eks"   = "shared"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"           = 1
    "kubernetes.io/cluster/${local.name}-eks"   = "shared"
  }
}

# ─── EKS ──────────────────────────────────────────
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${local.name}-eks"
  cluster_version = var.cluster_version
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  enable_cluster_creator_admin_permissions = true

  eks_managed_node_groups = {
    general = {
      instance_types = ["m5.large"]; capacity_type = "ON_DEMAND"
      min_size = 2; max_size = 10; desired_size = 3
    }
    spot = {
      instance_types = ["m5.large", "m5a.large"]; capacity_type = "SPOT"
      min_size = 0; max_size = 10; desired_size = 2
      taints = [{ key = "spot", value = "true", effect = "NO_SCHEDULE" }]
    }
  }
}

# ─── RDS ──────────────────────────────────────────
resource "random_password" "db" { length = 32; special = false }

resource "aws_secretsmanager_secret" "db" {
  name = "${local.name}/rds/password"
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username, password = random_password.db.result
    host = module.rds.db_instance_address, port = 5432, dbname = var.db_name
  })
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.3"

  identifier           = "${local.name}-postgres"
  engine               = "postgres"; engine_version = "16.1"
  family               = "postgres16"; instance_class = var.db_instance_class
  allocated_storage    = 100; max_allocated_storage = 500
  db_name              = var.db_name; username = var.db_username
  password             = random_password.db.result; port = 5432
  multi_az             = true
  db_subnet_group_name = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.rds_sg.security_group_id]

  backup_retention_period      = 14
  performance_insights_enabled = true
  deletion_protection          = true
  skip_final_snapshot          = false
}

module "rds_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.1"
  name = "${local.name}-rds"; vpc_id = module.vpc.vpc_id
  ingress_with_source_security_group_id = [{
    from_port = 5432; to_port = 5432; protocol = "tcp"
    description = "PostgreSQL from EKS"
    source_security_group_id = module.eks.node_security_group_id
  }]
}

# ─── Outputs ──────────────────────────────────────
output "eks_cluster_name" { value = module.eks.cluster_name }
output "rds_endpoint" { value = module.rds.db_instance_endpoint; sensitive = true }
output "kubeconfig_cmd" {
  value = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.region}"
}
```

> [!summary]
> Пример демонстрирует production-ready подход: VPC с публичными и приватными подсетями в трёх AZ, EKS с ON_DEMAND и SPOT node groups, RDS PostgreSQL с Multi-AZ и шифрованием, секреты в AWS Secrets Manager, минимальные security groups.
