
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

После запуска виртуалки с образом, у нас идёт самая стандартная установка, во время которой нам нужно будет подтвердить выбор установки OpenSSH и docker.

Далее в VB нужно прокинуть порты с нашей виртуальной машины на хост: Образ -> Настройки -> Сеть -> Дополнительно -> Проброс портов -> указываем нужные порты

![](_png/Pasted%20image%2020250112123358.png)

Далее нам не нужно входить на наш сервер каждый раз по логину/паролю. Достаточно указать данную команду для входа:

```bash
ssh <user>@127.0.0.1 -p 2222
```

Далее на хостовой машине получаем публичный ключ

```bash
cat ~/.ssh/id_ed25519.pub
```

И добавляем ключ в виртуалку в файл `authorized_keys`. Этот файл хранит ключи устройств, которые могут к нему подключаться по ssh.

```bash
mkdir ~/.ssh
cd ~/.ssh
nano authorized_keys
```

Теперь нам не нужно будет каждый раз вводить лог/пас для входа.
