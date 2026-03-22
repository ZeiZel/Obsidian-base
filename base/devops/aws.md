---
tags:
  - devops
  - aws
  - cloud
title: AWS
---
## Обзор AWS

Amazon Web Services - крупнейшая облачная платформа, предоставляющая более 200 сервисов из дата-центров по всему миру. Для DevOps-инженера AWS является основной площадкой для построения отказоустойчивой инфраструктуры.

### Глобальная инфраструктура

AWS разделяет инфраструктуру на три уровня:

- Region - географически изолированная группа дата-центров. Каждый регион полностью независим от остальных. Выбор региона определяется требованиями к задержке, стоимости и compliance
- Availability Zone (AZ) - один или несколько физически разделённых дата-центров внутри региона с независимым питанием, охлаждением и сетью. Между AZ одного региона задержка менее 2 мс
- Edge Location - точки присутствия для CDN (CloudFront) и DNS (Route53), расположенные ближе к конечным пользователям

> [!important]
> Отказоустойчивая архитектура всегда использует минимум 2 AZ в одном регионе. Multi-region deployment применяется для DR и глобального покрытия.

### AWS CLI

Установка и базовая конфигурация:

```bash
# Установка на Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Конфигурация профиля
aws configure --profile production
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: ...
# Default region name: eu-central-1
# Default output format: json

# Использование конкретного профиля
export AWS_PROFILE=production

# Проверка текущей идентичности
aws sts get-caller-identity
```

Конфигурация хранится в двух файлах:

```ini
# ~/.aws/credentials
[production]
aws_access_key_id = AKIA...
aws_secret_access_key = ...

# ~/.aws/config
[profile production]
region = eu-central-1
output = json
```

---

## IAM

**Identity and Access Management** - сервис управления доступом ко всем ресурсам AWS. Работает глобально, не привязан к конкретному региону.

### Основные сущности

- User - учётная запись человека или сервиса. Имеет постоянные credentials
- Group - набор пользователей с одинаковым набором прав. Пользователь может входить в несколько групп
- Role - набор прав, который может временно принять (assume) пользователь, сервис или внешняя система. Не имеет постоянных credentials, выдаёт временные токены через STS
- Policy - JSON-документ, описывающий разрешения. Привязывается к user, group или role

### Типы политик

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3Read",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "10.0.0.0/8"
        }
      }
    }
  ]
}
```

Виды политик:

- AWS Managed - готовые политики от AWS (AmazonS3ReadOnlyAccess, AdministratorAccess)
- Customer Managed - кастомные политики, созданные в аккаунте
- Inline - политика, встроенная напрямую в user, group или role. Не рекомендуется для production из-за сложности управления

### Assume Role

Механизм временного получения прав через AWS STS. Role содержит trust policy, определяющую кто может её принять:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

```bash
# Ручной assume role через CLI
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/DeployRole \
  --role-session-name deploy-session
```

### OIDC Federation для CI/CD

Позволяет GitHub Actions, GitLab CI и другим системам получать временные AWS credentials без хранения ключей:

```hcl
# Terraform: OIDC провайдер для GitHub Actions
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:myorg/myrepo:ref:refs/heads/main"
        }
      }
    }]
  })
}
```

### AWS Organizations и SCP

AWS Organizations объединяет несколько аккаунтов в иерархию с централизованным управлением. Service Control Policies (SCP) задают максимальные границы прав для аккаунтов:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyRegionsOutsideEU",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["eu-central-1", "eu-west-1"]
        }
      }
    }
  ]
}
```

> [!info]
> SCP не дают прав, а ограничивают их. Даже если у пользователя есть AdministratorAccess, SCP может запретить использование определённых регионов или сервисов.

---

## VPC

**Virtual Private Cloud** - изолированная виртуальная сеть внутри AWS. Каждый VPC ограничен одним регионом, но охватывает все AZ региона.

### Архитектура VPC

```
VPC (10.0.0.0/16)
├── Public Subnet AZ-a  (10.0.1.0/24) → Internet Gateway
├── Public Subnet AZ-b  (10.0.2.0/24) → Internet Gateway
├── Private Subnet AZ-a (10.0.10.0/24) → NAT Gateway
├── Private Subnet AZ-b (10.0.20.0/24) → NAT Gateway
└── DB Subnet AZ-a      (10.0.100.0/24) → No internet
    DB Subnet AZ-b      (10.0.200.0/24) → No internet
```

- Public subnet - подсеть с маршрутом к Internet Gateway. Ресурсам назначается публичный IP
- Private subnet - подсеть без прямого доступа из интернета. Выход в интернет через NAT Gateway
- Internet Gateway (IGW) - обеспечивает входящий и исходящий трафик между VPC и интернетом
- NAT Gateway - позволяет ресурсам в private subnet выходить в интернет, но не принимать входящие соединения

### Terraform: базовый VPC

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "production-vpc" }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 1)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "public-${count.index + 1}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "private-${count.index + 1}" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
}

resource "aws_eip" "nat" {
  domain = "vpc"
}
```

### Security Groups vs NACLs

| Характеристика | Security Group | NACL |
|----------------|---------------|------|
| Уровень | Instance (ENI) | Subnet |
| Состояние | Stateful | Stateless |
| Правила | Только Allow | Allow и Deny |
| Порядок | Все правила оцениваются | По номеру правила |
| По умолчанию | Deny all inbound, Allow all outbound | Allow all |

```hcl
resource "aws_security_group" "web" {
  name_prefix = "web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### VPC Endpoints

Позволяют обращаться к сервисам AWS (S3, DynamoDB, ECR) из private subnet без выхода в интернет. Два типа:

- Gateway endpoint - для S3 и DynamoDB, бесплатный, маршрутизируется через route table
- Interface endpoint - для остальных сервисов, создаёт ENI в подсети, стоит денег

### Transit Gateway

Центральный хаб для соединения нескольких VPC, VPN и Direct Connect. Заменяет mesh VPC peering:

```
VPC-A ─┐
VPC-B ─┤── Transit Gateway ──── On-premise (VPN/DX)
VPC-C ─┘
```

### VPC Flow Logs

Захватывают информацию о трафике на уровне VPC, subnet или ENI. Полезны для аудита, troubleshooting и обнаружения аномалий:

```bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids vpc-abc123 \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /vpc/flow-logs
```

---

## EC2

**Elastic Compute Cloud** - виртуальные серверы в облаке. Основа вычислительных ресурсов AWS.

### Instance Types

Имя типа инстанса кодирует его характеристики - например, m5.xlarge:

- m - семейство (general purpose)
- 5 - поколение
- xlarge - размер

Основные семейства:

| Семейство | Назначение | Примеры использования |
|-----------|-----------|----------------------|
| t3/t4g | Burstable, general purpose | Dev/staging, небольшие приложения |
| m5/m6i | Balanced CPU/RAM | Web-серверы, application серверы |
| c5/c6i | Compute optimized | Batch processing, ML inference |
| r5/r6i | Memory optimized | In-memory кэши, БД |
| i3/i4i | Storage optimized | NoSQL, data warehousing |
| g5/p4 | GPU | ML training, video encoding |

### Launch Templates

Определяют параметры запуска инстансов - AMI, тип, сеть, user data:

```hcl
resource "aws_launch_template" "app" {
  name_prefix   = "app-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = "m5.large"
  key_name      = aws_key_pair.deploy.key_name

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update && apt-get install -y docker.io
    systemctl enable docker && systemctl start docker
    docker pull myregistry/myapp:latest
    docker run -d -p 8080:8080 myregistry/myapp:latest
  EOF
  )

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  metadata_options {
    http_tokens   = "required"  # Enforce IMDSv2
    http_endpoint = "enabled"
  }

  tag_specifications {
    resource_type = "instance"
    tags = { Environment = "production" }
  }
}
```

### Auto Scaling Groups

ASG автоматически поддерживает нужное количество инстансов и масштабирует их по нагрузке:

```hcl
resource "aws_autoscaling_group" "app" {
  name                = "app-asg"
  desired_capacity    = 3
  min_size            = 2
  max_size            = 10
  vpc_zone_identifier = aws_subnet.private[*].id
  health_check_type   = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 90
    }
  }

  tag {
    key                 = "Name"
    value               = "app-instance"
    propagate_at_launch = true
  }
}

# Target Tracking Policy
resource "aws_autoscaling_policy" "cpu" {
  name                   = "cpu-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 60.0
  }
}
```

Lifecycle hooks позволяют выполнять действия при запуске или завершении инстанса - установка софта, drain connections, отправка логов.

### Placement Groups

- Cluster - инстансы в одной стойке. Минимальная задержка, но риск при выходе стойки из строя
- Spread - инстансы на разном оборудовании. Максимум 7 инстансов на AZ
- Partition - инстансы разделены на группы, каждая на отдельном оборудовании. Для HDFS, Cassandra, Kafka

---

## EKS

**Elastic Kubernetes Service** - managed Kubernetes на AWS. Control plane полностью управляется AWS.

### Типы вычислений

- Managed Node Groups - EC2-инстансы, управляемые AWS. AMI обновления, scaling и rolling updates автоматические
- Self-Managed Nodes - полный контроль над EC2 инстансами. Больше работы, больше гибкости
- Fargate Profiles - serverless. Каждый pod запускается в изолированной микро-VM. Нет управления нодами

### Terraform: EKS кластер

```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "production"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    general = {
      instance_types = ["m5.xlarge"]
      min_size       = 2
      max_size       = 10
      desired_size   = 3

      labels = {
        workload = "general"
      }
    }

    spot = {
      instance_types = ["m5.xlarge", "m5.2xlarge", "m6i.xlarge"]
      capacity_type  = "SPOT"
      min_size       = 0
      max_size       = 20
      desired_size   = 2

      labels = {
        workload = "batch"
      }

      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }

  cluster_addons = {
    coredns    = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni    = { most_recent = true }
    aws-ebs-csi-driver = {
      most_recent              = true
      service_account_role_arn = module.ebs_csi_irsa.iam_role_arn
    }
  }
}
```

### IRSA - IAM Roles for Service Accounts

Связывает Kubernetes ServiceAccount с IAM Role через OIDC. Позволяет подам получать AWS permissions без node-level credentials:

```hcl
module "s3_reader_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "s3-reader"

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["app:s3-reader-sa"]
    }
  }

  role_policy_arns = {
    s3_read = aws_iam_policy.s3_read.arn
  }
}
```

```yaml
# Kubernetes ServiceAccount с аннотацией
apiVersion: v1
kind: ServiceAccount
metadata:
  name: s3-reader-sa
  namespace: app
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/s3-reader
```

### ALB Ingress Controller

AWS Load Balancer Controller создаёт ALB/NLB по Kubernetes Ingress/Service ресурсам:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/healthcheck-path: /health
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80
```

### Karpenter vs Cluster Autoscaler

Cluster Autoscaler работает на уровне ASG - масштабирует node groups. Karpenter работает на уровне AWS API напрямую, выбирая оптимальный тип инстанса для pending pods:

```yaml
# Karpenter NodePool
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      requirements:
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand", "spot"]
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["m5.large", "m5.xlarge", "m6i.large", "m6i.xlarge"]
      - key: topology.kubernetes.io/zone
        operator: In
        values: ["eu-central-1a", "eu-central-1b"]
  limits:
    cpu: "100"
    memory: 400Gi
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s
```

> [!info]
> Karpenter предпочтительнее Cluster Autoscaler для новых кластеров. Он быстрее принимает решения о scaling, выбирает оптимальные типы инстансов и поддерживает consolidation.

---

## S3

**Simple Storage Service** - объектное хранилище с практически неограниченной ёмкостью. Доступность 99.999999999% (11 девяток).

### Классы хранения

| Класс | Доступность | Задержка | Стоимость | Применение |
|-------|------------|----------|-----------|-----------|
| Standard | 99.99% | мс | Высокая | Частый доступ |
| Intelligent-Tiering | 99.9% | мс | Адаптивная | Непредсказуемый паттерн |
| Standard-IA | 99.9% | мс | Ниже, но за чтение | Редкий доступ |
| One Zone-IA | 99.5% | мс | Ещё ниже | Воспроизводимые данные |
| Glacier Instant Retrieval | 99.9% | мс | Низкая | Архив с быстрым доступом |
| Glacier Flexible Retrieval | 99.99% | мин-часы | Очень низкая | Архив |
| Glacier Deep Archive | 99.99% | 12-48 часов | Минимальная | Долгосрочный архив |

### Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAC",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-static-site/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/E1234567"
        }
      }
    }
  ]
}
```

### Lifecycle Rules

Автоматическое перемещение объектов между классами и удаление:

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
```

### Versioning и Replication

Versioning сохраняет все версии объекта, защищая от случайного удаления. Replication копирует объекты между бакетами:

- Cross-Region Replication (CRR) - между регионами, для DR и уменьшения задержки
- Same-Region Replication (SRR) - в одном регионе, для агрегации логов и compliance

### Шифрование

- SSE-S3 - AWS управляет ключами, шифрование AES-256. По умолчанию с 2023 года
- SSE-KMS - ключи в KMS, гранулярный контроль доступа, аудит через CloudTrail
- SSE-C - клиент предоставляет ключ при каждом запросе

### Presigned URLs

Временная ссылка для загрузки или скачивания без AWS credentials:

```bash
# Генерация presigned URL на 1 час
aws s3 presign s3://my-bucket/report.pdf --expires-in 3600
```

---

## RDS и Aurora

**Relational Database Service** - managed реляционные базы данных. Поддерживает PostgreSQL, MySQL, MariaDB, Oracle, SQL Server.

### Multi-AZ и Read Replicas

- Multi-AZ - синхронная репликация в standby инстанс другой AZ. Автоматический failover за 60-120 секунд. Для высокой доступности
- Read Replicas - асинхронная репликация. До 15 реплик для Aurora, до 5 для RDS. Для горизонтального масштабирования чтения. Могут быть cross-region

### Terraform: RDS PostgreSQL

```hcl
resource "aws_db_instance" "postgres" {
  identifier     = "production-pg"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.r6i.xlarge"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "app"
  username = "admin"
  password = var.db_password

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = 14
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "production-pg-final"

  parameter_group_name = aws_db_parameter_group.pg16.name
}

resource "aws_db_parameter_group" "pg16" {
  family = "postgres16"
  name   = "production-pg16"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
}
```

### Aurora

Aurora - проприетарный движок AWS, совместимый с PostgreSQL и MySQL. Хранилище автоматически масштабируется до 128 ТБ, репликация между 3 AZ на уровне хранилища.

- Aurora Serverless v2 - автоматическое масштабирование вычислений от 0.5 до 256 ACU. Подходит для непредсказуемой нагрузки
- Performance Insights - визуализация нагрузки на БД по ожиданиям (waits), SQL-запросам и сессиям. Помогает определить узкие места

> [!important]
> Для production всегда включайте deletion_protection, automated backups с достаточным retention и Performance Insights. Point-in-time recovery позволяет восстановить БД на любой момент в пределах backup retention period.

---

## Route53

DNS-сервис AWS с доступностью 100% SLA. Поддерживает публичные и приватные hosted zones.

### Типы записей

- A - IPv4 адрес
- AAAA - IPv6 адрес
- CNAME - каноническое имя. Нельзя использовать для apex домена
- Alias - специфичный для AWS тип, направляет на AWS ресурсы (ALB, CloudFront, S3). Работает для apex домена, бесплатные запросы

### Routing Policies

| Политика | Поведение | Применение |
|----------|----------|-----------|
| Simple | Один ресурс | Простые записи |
| Weighted | Распределение по весам | A/B тестирование, canary deploys |
| Latency | Маршрут к ближайшему региону | Multi-region приложения |
| Failover | Primary/Secondary | DR, active-passive |
| Geolocation | По географии пользователя | Compliance, локализация |
| Multivalue | Несколько записей с health checks | Простой load balancing |

### Health Checks

```hcl
resource "aws_route53_health_check" "app" {
  fqdn              = "app.example.com"
  port               = 443
  type               = "HTTPS"
  resource_path      = "/health"
  failure_threshold  = 3
  request_interval   = 30

  tags = { Name = "app-health-check" }
}

resource "aws_route53_record" "failover_primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.example.com"
  type    = "A"

  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.app.id
}
```

---

## ELB

**Elastic Load Balancing** - распределение трафика между целевыми ресурсами.

### Сравнение типов

| Характеристика | ALB | NLB | CLB |
|---------------|-----|-----|-----|
| Уровень | L7 (HTTP/HTTPS) | L4 (TCP/UDP/TLS) | L4/L7 (legacy) |
| Протоколы | HTTP, HTTPS, gRPC | TCP, UDP, TLS | TCP, HTTP |
| Задержка | ~10 мс | ~100 мкс | ~10 мс |
| WebSocket | Да | Да | Нет |
| Static IP | Нет | Да | Нет |
| Routing | Path, host, header, query | Port | Нет |
| Рекомендация | Веб-приложения | Высокая нагрузка, gRPC, IoT | Не использовать |

### ALB с Terraform

```hcl
resource "aws_lb" "app" {
  name               = "app-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true
  drop_invalid_header_fields = true
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_target_group" "app" {
  name        = "app-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 15
    matcher             = "200"
  }

  deregistration_delay = 30

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 3600
    enabled         = false
  }
}
```

> [!info]
> Cross-zone load balancing включён по умолчанию для ALB. Для NLB его нужно включать явно, и он тарифицируется отдельно.

---

## CloudFront

CDN-сервис AWS с более чем 600 edge locations. Кэширует контент ближе к пользователям и снижает нагрузку на origin.

### Основные концепции

- Distribution - конфигурация CDN с привязанными origins и behaviors
- Origin - источник контента (S3, ALB, custom HTTP server)
- Behavior - правила кэширования и обработки запросов по URL pattern
- Cache Policy - настройки TTL и ключей кэширования
- Origin Request Policy - какие заголовки и параметры передавать на origin

### Terraform: CloudFront + S3

```hcl
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["cdn.example.com"]
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id                = "s3-static"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  origin {
    domain_name = aws_lb.app.dns_name
    origin_id   = "alb-api"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-static"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3.id
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "alb-api"
    viewer_protocol_policy = "https-only"

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
```

### Lambda@Edge и CloudFront Functions

- CloudFront Functions - лёгкие функции на JavaScript для простых преобразований (redirect, header manipulation). Выполняются за менее чем 1 мс
- Lambda@Edge - полноценные Lambda функции. Для сложной логики: A/B тестирование, авторизация, SSR

### Invalidation

Принудительная очистка кэша:

```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567 \
  --paths "/*"
```

---

## SQS и SNS

### SQS - Simple Queue Service

Полностью управляемая очередь сообщений для асинхронной коммуникации между сервисами.

| Характеристика | Standard | FIFO |
|---------------|----------|------|
| Порядок | Best-effort | Строгий FIFO |
| Дедупликация | Нет гарантии | Content-based или MessageDeduplicationId |
| Пропускная способность | Практически неограниченная | 3000 msg/s с батчами |
| Имя очереди | Любое | Суффикс .fifo |

Ключевые параметры:

- Visibility Timeout - время, на которое сообщение скрывается после получения consumer. По умолчанию 30 секунд. Если consumer не удалил сообщение за это время, оно снова станет доступным
- Dead Letter Queue (DLQ) - очередь для сообщений, которые не удалось обработать после maxReceiveCount попыток

```hcl
resource "aws_sqs_queue" "orders" {
  name                       = "orders-queue"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 1209600  # 14 дней
  receive_wait_time_seconds  = 20       # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.orders_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "orders_dlq" {
  name                      = "orders-dlq"
  message_retention_seconds = 1209600
}
```

### SNS - Simple Notification Service

Pub/sub сервис для рассылки сообщений множеству подписчиков:

- Topic - канал для публикации
- Subscription - подписка на topic (SQS, Lambda, HTTP, Email, SMS)

### Fan-out паттерн

SNS topic публикует сообщение, несколько SQS очередей получают копию:

```
Producer → SNS Topic ─┬→ SQS Queue (Order Processing)
                       ├→ SQS Queue (Analytics)
                       └→ SQS Queue (Notification Service)
```

```hcl
resource "aws_sns_topic" "order_events" {
  name = "order-events"
}

resource "aws_sns_topic_subscription" "order_processing" {
  topic_arn = aws_sns_topic.order_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.order_processing.arn
}
```

---

## CloudWatch

Мониторинг и observability платформа AWS.

### Metrics

Каждый сервис AWS публикует метрики в CloudWatch автоматически. Custom metrics позволяют отправлять свои данные:

```bash
aws cloudwatch put-metric-data \
  --namespace "MyApp" \
  --metric-name "OrdersProcessed" \
  --value 42 \
  --unit Count \
  --dimensions Environment=production,Service=order-api
```

### Alarms

```hcl
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization exceeds 80% for 15 minutes"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}
```

### CloudWatch Logs

Структура: Log Group → Log Stream → Log Events.

```hcl
resource "aws_cloudwatch_log_group" "app" {
  name              = "/app/production"
  retention_in_days = 30

  tags = { Environment = "production" }
}
```

### Logs Insights

Язык запросов для анализа логов:

```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() as errorCount by bin(5m)
| sort errorCount desc
| limit 20
```

### Container Insights

Мониторинг для ECS и EKS. Собирает метрики по кластерам, сервисам, задачам и контейнерам. Включается как add-on в EKS:

```hcl
resource "aws_eks_addon" "cloudwatch_observability" {
  cluster_name = module.eks.cluster_name
  addon_name   = "amazon-cloudwatch-observability"
}
```

---

## Secrets Manager и Parameter Store

### Сравнение

| Характеристика | Secrets Manager | Parameter Store |
|---------------|----------------|-----------------|
| Стоимость | $0.40/secret/месяц | Бесплатно (Standard) |
| Автоматическая ротация | Да (Lambda) | Нет |
| Cross-account доступ | Да | Ограниченный |
| Размер значения | 64 КБ | 4/8 КБ |
| Назначение | Credentials, API keys | Конфигурация, флаги |

### Secrets Manager

```bash
# Создание секрета
aws secretsmanager create-secret \
  --name "production/db/postgres" \
  --secret-string '{"username":"admin","password":"s3cur3!"}'

# Получение секрета
aws secretsmanager get-secret-value \
  --secret-id "production/db/postgres" \
  --query SecretString --output text
```

### Parameter Store

```bash
# Создание параметра
aws ssm put-parameter \
  --name "/production/app/api-url" \
  --value "https://api.example.com" \
  --type String

# SecureString - шифруется KMS
aws ssm put-parameter \
  --name "/production/app/api-key" \
  --value "sk-abc123" \
  --type SecureString
```

### Доступ из EKS

External Secrets Operator синхронизирует секреты из AWS в Kubernetes Secrets:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: app
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: db-credentials
  data:
  - secretKey: username
    remoteRef:
      key: production/db/postgres
      property: username
  - secretKey: password
    remoteRef:
      key: production/db/postgres
      property: password
```

### Доступ из Lambda

```python
import boto3
import json

def get_secret(secret_name):
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])
```

---

## Lambda

Serverless вычисления. Код выполняется в ответ на события без управления серверами. Оплата за время выполнения с точностью до 1 мс.

### Основные концепции

- Handler - точка входа функции
- Layer - разделяемые зависимости между функциями
- Version - неизменяемый snapshot функции
- Alias - указатель на версию. Позволяет реализовать canary deployment
- Event Source - триггер вызова (API Gateway, SQS, S3, EventBridge, Schedule)

### Пример: обработчик SQS сообщений

```python
import json
import boto3

def handler(event, context):
    for record in event["Records"]:
        body = json.loads(record["body"])
        process_order(body)
    return {"statusCode": 200}

def process_order(order):
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("orders")
    table.put_item(Item=order)
```

### Terraform: Lambda с SQS trigger

```hcl
resource "aws_lambda_function" "processor" {
  function_name = "order-processor"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.handler"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 256

  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.orders.name
      LOG_LEVEL  = "INFO"
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  layers = [aws_lambda_layer_version.common.arn]
}

resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn                   = aws_sqs_queue.orders.arn
  function_name                      = aws_lambda_function.processor.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5

  function_response_types = ["ReportBatchItemFailures"]
}
```

### Cold Start

При первом вызове или после периода неактивности Lambda инициализирует окружение. Это добавляет задержку от 100 мс до нескольких секунд. Способы минимизации:

- Provisioned Concurrency - держит заданное количество инстансов прогретыми
- Меньший размер deployment package
- Использование lightweight runtime (Python, Node.js быстрее Java)
- SnapStart для Java - создаёт snapshot инициализированного инстанса

> [!info]
> VPC-attached Lambda функции больше не страдают от длительных cold starts. С 2019 года AWS использует Hyperplane ENI, что сократило инициализацию сети до секунд вместо минут.

---

## Cost Optimization

### Модели оплаты за вычисления

| Модель | Скидка | Обязательство | Применение |
|--------|--------|-------------|-----------|
| On-Demand | 0% | Нет | Непредсказуемая нагрузка |
| Reserved Instances | до 72% | 1-3 года | Стабильная базовая нагрузка |
| Savings Plans | до 72% | 1-3 года | Гибче чем RI, кросс-сервисные |
| Spot Instances | до 90% | Нет, могут забрать | Batch, CI/CD, stateless workloads |

### Spot Instances

Неиспользуемая ёмкость EC2 со скидкой до 90%. AWS может забрать инстанс с уведомлением за 2 минуты:

```hcl
resource "aws_launch_template" "spot" {
  instance_market_options {
    market_type = "spot"
    spot_options {
      max_price                      = "0.05"
      spot_instance_type             = "persistent"
      instance_interruption_behavior = "stop"
    }
  }
}
```

Стратегии использования spot:

- Diversification - запрашивать разные типы инстансов и AZ
- Graceful shutdown - обрабатывать 2-минутное предупреждение
- Checkpointing - сохранять прогресс для batch jobs
- Смешивание с on-demand через mixed instances policy в ASG

### Cost Explorer и Budgets

```bash
# Создание бюджета с алертами
aws budgets create-budget \
  --account-id 123456789012 \
  --budget '{
    "BudgetName": "monthly-total",
    "BudgetLimit": {"Amount": "5000", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "team@example.com"
    }]
  }]'
```

### Infracost

Оценка стоимости Terraform изменений до apply:

```bash
# В CI/CD pipeline
infracost breakdown --path=./terraform
infracost diff --path=./terraform --compare-to=infracost-base.json
```

### Практические рекомендации

- Включить Cost Allocation Tags для отслеживания расходов по проектам и командам
- Использовать Savings Plans вместо Reserved Instances для новых обязательств
- Настроить Trusted Advisor для поиска неиспользуемых ресурсов
- Удалять unattached EBS volumes, unused Elastic IPs, idle load balancers
- Использовать S3 Intelligent-Tiering для данных с неизвестным паттерном доступа
- Настроить автоматическое выключение dev/staging окружений в нерабочее время

---

## Well-Architected Framework

Фреймворк AWS из 6 столпов для проектирования надёжных, безопасных и эффективных систем.

### 1. Operational Excellence

Автоматизация операций, infrastructure as code, observability, frequent small changes. Runbooks для рутинных операций, playbooks для инцидентов.

### 2. Security

Принцип least privilege, шифрование everywhere, многоуровневая защита. Автоматизация security controls, traceability через CloudTrail, incident response plan.

### 3. Reliability

Автоматическое восстановление после сбоев. Horizontal scaling, multi-AZ deployment, chaos engineering. Тестирование DR процедур регулярно.

### 4. Performance Efficiency

Выбор правильных ресурсов для задачи. Serverless где возможно, caching для снижения нагрузки, мониторинг производительности. Benchmark и load testing.

### 5. Cost Optimization

Платить только за то, что используется. Right-sizing, spot instances для batch, lifecycle policies для хранилищ. Финансовая ответственность через теги и бюджеты.

### 6. Sustainability

Минимизация воздействия на окружающую среду. Эффективное использование ресурсов, выбор регионов с возобновляемой энергией, оптимизация кода для снижения потребления.

> [!summary]
> AWS Well-Architected Tool в консоли позволяет провести ревью архитектуры по всем 6 столпам и получить список рекомендаций с приоритетами.
