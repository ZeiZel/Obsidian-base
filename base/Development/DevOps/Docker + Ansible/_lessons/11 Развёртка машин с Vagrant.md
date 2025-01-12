
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



`Vagrantfile`
```bash
Vagrant.configure("2") do |config|
	(1..5).each do |i|
		config.vm.define "server#{i}" do |web|
			web.vm.box = "ubuntu/focal64"
			web.vm.network "forwarded_port", id: "ssh", host: 2222 + i, guest: 22
			web.vm.network "private_network", ip: "10.11.10.#{i}", virtualbox__intnet: true
			web.vm.hostname = "server#{i}"

			web.vm.provision "shell" do |s|
				ssh_pub_key = File.readlines("#{Dir.home}/.ssh/id_rsa.pub").first.strip
				s.inline = <<-SHELL
				echo #{ssh_pub_key} >> /home/vagrant/.ssh/authorized_keys
				echo #{ssh_pub_key} >> /root/.ssh/authorized_keys
				SHELL
			end

			web.vm.provider "virtualbox" do |v|
				v.name = "server#{i}"
				v.memory = 2048
				v.cpus = 1
			end
		end
	end
end
```

## Подготовка серверов






