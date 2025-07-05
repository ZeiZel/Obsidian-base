
[Setup VM's Ubuntu](https://gist.github.com/anupkrbid/e894af7df2d43a4e253fc252251dd7fe)

### Установка Docker на виртуальную машину на MacOS

```bash
# 1. Удалим текущий GPG-ключ и источник
sudo rm -f /etc/apt/keyrings/docker.gpg
sudo rm -f /etc/apt/sources.list.d/docker.list

# 2. Установим GPG-ключ заново
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Добавим репозиторий как `jammy` (вместо noble!)
echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu jammy stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Обновим apt и установим Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
                    docker-buildx-plugin docker-compose-plugin
```

```bash
sudo systemctl start docker
```

```bash
sudo systemctl enable docker
```
