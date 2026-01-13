Set secrets in GitHub web app repo: 
- EC2_HOST: EC2 instance ip
- EC2_USER: deploy
- EC2_SSH_KEY: entire private key pem
- DATABASE_URL: AWS database URL

Create EC2 instance

Apply 'webserver' security group to instance

Commands: 
- ssh -i <.pem private key path> ec2-user@<instance public ip>
- sudo adduser deploy
- sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
- sudo cp /home/ec2-user/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
- sudo chown -R deploy:deploy /home/deploy/.ssh
- sudo chmod 600 /home/deploy/.ssh/authorized_keys
- sudo dnf install -y docker docker-compose-plugin
- sudo systemctl enable --now docker
- sudo groupadd -f docker
- sudo usermod -aG docker deploy
- sudo mkdir -p /opt/app
- sudo chown -R deploy:deploy /opt/app
- ssh -i <.pem private key path> deploy@<instance public ip>
- scp -i <.pem private key path> -r <pitchcraft_repo_path>/* deploy@<instance public ip>:/opt/app

To manually run:
- docker compose pull --quiet || true
- docker compose up -d
- docker compose ps
- docker compose logs --no-log-prefix --since=5m

Otherwise, trigger via GitHub actions