
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

# либо
ENV['VAGRANT_SERVER_URL'] = 'https://hashicorp-releases.yandexcloud.net/vagrant/'
```

## Развёртка машин

Конфиг vagrant написан на [Ruby](../../../BackEnd/Ruby.md) 

`Vagrantfile`
```ruby
# миррор вагранта
ENV['VAGRANT_SERVER_URL'] = 'https://hashicorp-releases.yandexcloud.net/vagrant/'

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

```bash
vagrant up
```

## Подготовка серверов






