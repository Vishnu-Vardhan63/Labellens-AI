# LABEL LENS AI — PRODUCTION DEPLOYMENT GUIDE
**System Architecture & Deployment Specifications for Enterprise & Government Cloud**  
**Document Version**: `1.0.0-final`

---

## 1. Production Architecture Overview

```
                      [ Client Browser / Inspector Tablet / Android App ]
                                           │
                                           ▼ (HTTPS / WSS - Port 443)
                      ┌──────────────────────────────────────────────┐
                      │            NGINX Reverse Proxy               │
                      │  - TLS Termination (Let's Encrypt / Cert)    │
                      │  - Rate Limiting (100 req/min per IP)        │
                      │  - Max Body Size (15 MB client_max_body)     │
                      │  - Static Asset Caching (/assets/*)          │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │          Uvicorn ASGI Process Pool           │
                      │  (4 Workers - Gunicorn / Systemd / Docker)   │
                      │                                              │
                      │   [FastAPI Application Gateway]              │
                      │   ├── SecurityHeadersMiddleware              │
                      │   ├── SafeLoggingMiddleware (req_id, timing) │
                      │   └── ErrorHandler (Tripartite Contract)     │
                      │                                              │
                      │   [Pipeline Engine Services]                 │
                      │   ├── RapidOCR ONNX Local Inference          │
                      │   ├── OpenCV Image Quality & Glare Gate      │
                      │   ├── Legal Metrology PCR 2011 Engine        │
                      │   ├── Multilingual & Food Intelligence       │
                      │   ├── Confidence & Abstention Engine         │
                      │   └── Inspector Risk Triage Queue            │
                      └───────────────┬──────────────────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
        ┌─────────────────────┐               ┌─────────────────────┐
        │  Persistent Storage │               │ Relational Database │
        │  /data/uploads      │               │ SQLite / PostgreSQL │
        │  - Strict magic byte│               │ - Scans & Sessions  │
        │  - Path containment │               │ - Audit Logs (JSON) │
        │  - Unlink on purge  │               │ - Inspector Cases   │
        └─────────────────────┘               └─────────────────────┘
```

---

## 2. Environment Configuration Matrix

All configuration parameters are defined in `.env` (derived from `backend/.env.example`):

| Variable | Default Value | Recommended Production Value | Description |
|---|---|---|---|
| `ENVIRONMENT` | `development` | `production` | Enables production error redaction and optimizes logging |
| `HOST` | `0.0.0.0` | `127.0.0.1` (behind Nginx) | Host interface binding |
| `PORT` | `8000` | `8000` | Internal ASGI port |
| `DATABASE_URL` | `sqlite:///./label_lens.db` | `postgresql+psycopg2://usr:pwd@db:5432/labellens` | Database connection string |
| `UPLOAD_DIR` | `./uploads` | `/var/lib/labellens/uploads` | Path for raw uploaded package panel files |
| `MAX_UPLOAD_SIZE_MB` | `15` | `15` | Maximum image size in megabytes |
| `MAX_IMAGE_PIXELS` | `50000000` | `50000000` | Pillow decompression bomb safety ceiling (50MP) |
| `LOCAL_STORAGE_MODE` | `true` | `true` | Enforces zero external cloud persistence |
| `CORS_ORIGINS` | `http://localhost:5173,...` | `https://labellens.nic.in` | Explicit allowed web origins (never `*` in prod) |
| `APP_VERSION` | `1.0.0` | `1.0.0` | SemVer application identifier |

---

## 3. Deployment Option A: Standalone Linux Host (systemd + Nginx)

### 1. Host Setup & Virtual Environment
```bash
sudo apt update && sudo apt install -y python3.11 python3.11-venv python3.11-dev libgl1-mesa-glx libglib2.0-0 nginx

sudo mkdir -p /var/www/labellens /var/lib/labellens/uploads
sudo chown -R www-data:www-data /var/www/labellens /var/lib/labellens/uploads

cd /var/www/labellens
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Systemd Service Configuration
Create `/etc/systemd/system/labellens.service`:
```ini
[Unit]
Description=Label Lens AI Legal Metrology Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/labellens/backend
EnvironmentFile=/var/www/labellens/backend/.env
ExecStart=/var/www/labellens/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4 --log-level info
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now labellens
```

### 3. Nginx Reverse Proxy Configuration
Create `/etc/nginx/sites-available/labellens`:
```nginx
server {
    listen 80;
    server_name labellens.internal;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name labellens.internal;

    ssl_certificate /etc/ssl/certs/labellens.crt;
    ssl_certificate_key /etc/ssl/private/labellens.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 15M;

    # Frontend Static Distribution
    root /var/www/labellens/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # OpenAPI Documentation
    location ~ ^/(docs|redoc|openapi.json) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```
Enable and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/labellens /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. Deployment Option B: Containerized Docker Compose

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: labellens-backend
    restart: unless-stopped
    environment:
      - ENVIRONMENT=production
      - HOST=0.0.0.0
      - PORT=8000
      - DATABASE_URL=sqlite:////data/label_lens.db
      - UPLOAD_DIR=/data/uploads
      - MAX_UPLOAD_SIZE_MB=15
      - LOCAL_STORAGE_MODE=true
      - CORS_ORIGINS=http://localhost:5173,https://labellens.internal
    volumes:
      - labellens_data:/data
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: labellens-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  labellens_data:
```

---

## 5. Security Checklist Before Public Launch

- [x] Set `ENVIRONMENT=production` in `.env`.
- [x] Restrict `CORS_ORIGINS` to the exact production domain names.
- [x] Verify that upload directories are isolated outside web-accessible roots.
- [x] Validate that database connection credentials use secret management.
- [x] Test `GET /api/system/status` to ensure zero `BLOCKER` or `WARNING` items.
- [x] Verify automated backups for `label_lens.db` and `/data/uploads`.
