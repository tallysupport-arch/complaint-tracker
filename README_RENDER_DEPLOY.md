# Complaint Tracker - Render + GitHub Ready

## What is fixed in this ZIP

- Login page no longer pre-fills username/password.
- Complaints add/edit/delete/status update work with backend API.
- AMC add/edit/delete/renew works with backend API.
- Client Master import/add/edit/delete works.
- Complaint import works.
- Export Excel includes Complaints, AMC, Client Master, and Users sheets.
- Export CSV works for Complaints.
- UI auto-refreshes after add/edit/delete/import, so manual browser refresh is not required.
- `/download-db` endpoint added to download the live SQLite DB.
- Supports Render Persistent Disk using `DATA_DIR=/var/data` to avoid data loss.

## Render settings

Build Command:
```bash
npm install
```

Start Command:
```bash
npm start
```

## IMPORTANT: Avoid data loss on Render

Free Render filesystem is temporary. To avoid data loss:

1. Render Dashboard -> Your Service -> Disks
2. Add Disk
3. Mount Path:
```text
/var/data
```
4. Environment -> Add Environment Variable:
```text
DATA_DIR=/var/data
```
5. Save and redeploy.

Your database will then be stored at:
```text
/var/data/complaints.db
```

## Check live data

Complaints:
```text
https://YOUR-APP.onrender.com/complaints
```

AMC:
```text
https://YOUR-APP.onrender.com/amc
```

Users:
```text
https://YOUR-APP.onrender.com/users
```

Client Master:
```text
https://YOUR-APP.onrender.com/client-master
```

DB Info:
```text
https://YOUR-APP.onrender.com/db-info
```

Download DB:
```text
https://YOUR-APP.onrender.com/download-db
```

## Default login

The default admin still exists in DB:
```text
Username: admin
Password: 1234
```

The login page will not auto-fill it.
