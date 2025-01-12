
>[!info] Всю актуальную информацию по установке докера всегда можно найти в [официальной документации](https://docs.docker.com/engine/install/) а так же шагах [после установки](https://docs.docker.com/engine/install/linux-postinstall/)

#### Установка Docker

Устанавливаем сертификаты 

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
```

Далее устанавливаем ключ докера

```bash
sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

Устанавливаем репозиторий

```bash
 echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Ещё раз обновляем утилиту установки пакетов

```bash
sudo apt-get update
```

Устанавливаем пакеты докера

```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Проверяем работу докера

```bash
sudo docker run hello-world
```

Добавляем группу докера

```bash
sudo groupadd docker
```

Тут мы добавляем себя в группу докера

```bash
sudo usermod -aG docker $USER
```

#### Установка виртуалки

Для примера удалённой машины, будет использоваться
- Виртуализация - VirtualBox
- ОС - Ubuntu Server

Под Fedora перед запуском нужно было выполнить следующие команды:

```bash
sudo dnf install -y "kernel-devel-$(uname -r)"
sudo /sbin/vboxconfig
sudo rmmod kvm-intel
```










