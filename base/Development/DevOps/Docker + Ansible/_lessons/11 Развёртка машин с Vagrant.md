
## Установка

Установка могла бы быть простейшей, если бы vagrant не заблокировали установку для России.

Если использовать ВПН, то так:

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/vagrant
```

Если нет, то нужно будет устанавливать способами под определённые дистры из [доки](https://developer.hashicorp.com/vagrant/install)

Чтобы была возможность поднять Vagrant, нам нужно добавить в начало `Vagrantfile` энву с селфхост сервером:

```bash
ENV['VAGRANT_SERVER_URL'] = 'https://vagrant.elab.pro'
```

Скачать последнюю версию Vagrant мы можем из репозиториев [Yandex](https://hashicorp-releases.yandexcloud.net/vagrant/) или [Mail.ru](https://hashicorp-releases.mcs.mail.ru/vagrant/)

>[!warning] Vagrant поддерживает только определённые версии VB, поэтому лучше всего скачивать их последние версии, чтобы не было проблем с совместимостью!

## Развёртка машин

Генерируем RSA ключ на нашей машине

```bash
ssh-keygen -t rsa
```

Конфиг vagrant написан на [Ruby](../../../BackEnd/Ruby.md) 

`Vagrantfile`
```ruby
# миррор вагранта
ENV['VAGRANT_SERVER_URL'] = 'https://vagrant.elab.pro'

# конфигурация для второй версии
Vagrant.configure("2") do |config|
    # повторяется 5 раз, чтобы поднять 5 машин
	(1..5).each do |i|
        # выполнение команд для сервера под индексом (web - переменная конфига, которую мы именуем сами)
		config.vm.define "server#{i}" do |web|
            # box - это конкретная виртуалка, которую нужно развернуть
			web.vm.box = "ubuntu/focal64"
            # пробрасываем порты (хост порты 2223, 2224... на гостевой 22)
			web.vm.network "forwarded_port", id: "ssh", host: 2222 + i, guest: 22
            # порт для кластера
			web.vm.network "private_network", ip: "10.11.10.#{i}", virtualbox__intnet: true
            # именуем хост
            web.vm.hostname = "server#{i}"

            # открываем шелл, чтобы установить ssh-ключи
			web.vm.provision "shell" do |s|
                # путь к публичному ключу
				ssh_pub_key = File.readlines("#{Dir.home}/.ssh/id_rsa.pub").first.strip
                # вставляем ssh-ключ в vagrant (он используется тут как дефолтный пользователь удалённой машины)
				s.inline = <<-SHELL
				echo #{ssh_pub_key} >> /home/vagrant/.ssh/authorized_keys
				echo #{ssh_pub_key} >> /root/.ssh/authorized_keys
				SHELL
			end

            # подключаемся к провайдеру virtualbox, чтобы поднять 5 машин на убунте
			web.vm.provider "virtualbox" do |v|
				v.name = "server#{i}"
                # выделяем 2 гига озу
				v.memory = 2048
                # и по одному процессору
				v.cpus = 1
			end
		end
	end
end
```

И поднимаем всё окружение виртуальных машин следующей командой

```bash
vagrant up
```

![](_png/Pasted%20image%2020250112174851.png)

>[!seealso] Если мы поднимаем вагрант из под WSL, то нам нужно:
> 1. Хранить папку проекта на диске c Windows (не в директории linux `~/`)  
> 2. Разрешить Vagrant обращаться к Windows из под WSL через: `export VAGRANT_WSL_ENABLE_WINDOWS_ACCESS="1"`

>[!attention] Если выходит эта ошибка, то нужно удалить папку `.vagrant`
> The VirtualBox VM was created with a user that doesn't match the current user running Vagrant. VirtualBox requires that the same user be used to manage the VM that was created. Please re-run Vagrant with that user. This is not a Vagrant issue. The UID used to create the VM was: 1000 Your UID is: 0

Теперь мы можем подключиться к любому нашему серверу

```bash
ssh vagrant@127.0.0.1 -p 2223
```

>[!note] желательно сразу подключиться к каждому серверу и прописать `yes` при подключении к ssh

![](_png/Pasted%20image%2020250112175650.png)

#### Troubleshooting

Так же подключение может быть отклонено, если есть мусор в файле хостов Для решения проблем, нужно перейти в указанный файл 

![](_png/Pasted%20image%2020250112175816.png)

И удалить эти строки подключений к серверам

![](_png/Pasted%20image%2020250112180959.png)

## Подготовка серверов

> Нужно пройти ansible






