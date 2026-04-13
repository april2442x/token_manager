# คู่มือใช้งาน API

## URL ของ API

```
ทดสอบ: http://localhost:3000/api
จริง: https://your-app.railway.app/api
```

## ความปลอดภัย

ทุกครั้งที่เรียก API ต้องส่ง header เหล่านี้:
- `X-API-Key` - รหัส API ของคุณ
- `X-Signature` - ลายเซ็นเพื่อยืนยันตัวตน
- `X-Timestamp` - เวลาที่ส่งคำขอ
- `X-Nonce` - รหัสไม่ซ้ำกัน

## จำกัดการใช้งาน

- เปิดใช้งาน: 10 ครั้ง/15 นาที
- ตรวจสอบ: 60 ครั้ง/นาที
- ปิดใช้งาน: 100 ครั้ง/15 นาที

---

## 1. ตรวจสอบระบบ

ดูว่า API ทำงานหรือไม่

```bash
GET /api/health
```

**ผลลัพธ์:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-12T10:30:00.000Z"
}
```

---

## 2. เปิดใช้งาน License

เปิดใช้งาน license สำหรับอุปกรณ์

```bash
POST /api/activate
```

**ส่งข้อมูล:**
```json
{
  "key": "รหัส-license-ของคุณ",
  "device_id": "รหัสอุปกรณ์-เช่น-laptop-001"
}
```

**สำเร็จ:**
```json
{
  "valid": true,
  "expires_at": "2027-04-12T00:00:00.000Z",
  "max_devices": 3,
  "device_count": 1,
  "token": "..."
}
```

**ความหมาย:**
- `valid: true` = ใช้งานได้
- `expires_at` = วันหมดอายุ
- `max_devices` = ใช้ได้กี่เครื่อง
- `device_count` = ใช้ไปแล้วกี่เครื่อง

**ผิดพลาด:**
- รหัส license ไม่ถูกต้อง
- หมดอายุแล้ว
- ใช้ครบจำนวนเครื่องแล้ว

---

## 3. ตรวจสอบ License

ตรวจว่า license ยังใช้งานได้อยู่ไหม

```bash
POST /api/validate
```

**ส่งข้อมูล:**
```json
{
  "key": "รหัส-license-ของคุณ",
  "device_id": "รหัสอุปกรณ์"
}
```

**สำเร็จ:**
```json
{
  "valid": true,
  "expires_at": "2027-04-12T00:00:00.000Z",
  "token": "..."
}
```

**ผิดพลาด:**
- รหัส license ไม่ถูกต้อง
- หมดอายุแล้ว
- อุปกรณ์นี้ไม่ได้ลงทะเบียน

---

## 4. ปิดใช้งานอุปกรณ์

ลบอุปกรณ์ออกจาก license (เพื่อเอาไปใช้กับเครื่องอื่น)

```bash
POST /api/deactivate
```

**ส่งข้อมูล:**
```json
{
  "key": "รหัส-license-ของคุณ",
  "device_id": "รหัสอุปกรณ์"
}
```

**สำเร็จ:**
```json
{
  "success": true,
  "message": "ปิดใช้งานอุปกรณ์สำเร็จ"
}
```

---

## ตัวอย่างการใช้งาน

### JavaScript

```javascript
const crypto = require('crypto');

async function activateLicense(licenseKey, deviceId) {
  const API_KEY = 'your-api-key';
  const SECRET = 'your-signature-secret';
  
  // เตรียมข้อมูล
  const body = { key: licenseKey, device_id: deviceId };
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  
  // สร้างลายเซ็น
  const payload = `${timestamp}${nonce}${JSON.stringify(body)}`;
  const signature = crypto.createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');

  // เรียก API
  const response = await fetch('http://localhost:3000/api/activate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Signature': signature,
      'X-Timestamp': timestamp.toString(),
      'X-Nonce': nonce,
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

// ใช้งาน
const result = await activateLicense('LICENSE_KEY', 'my-laptop');
console.log(result);
```

### Python

```python
import requests, hmac, hashlib, json, time, uuid

def activate_license(license_key, device_id):
    API_KEY = 'your-api-key'
    SECRET = 'your-signature-secret'
    
    # เตรียมข้อมูล
    body = {'key': license_key, 'device_id': device_id}
    timestamp = int(time.time() * 1000)
    nonce = str(uuid.uuid4())
    
    # สร้างลายเซ็น
    payload = f"{timestamp}{nonce}{json.dumps(body, separators=(',', ':'))}"
    signature = hmac.new(
        SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # เรียก API
    response = requests.post('http://localhost:3000/api/activate',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            'X-Signature': signature,
            'X-Timestamp': str(timestamp),
            'X-Nonce': nonce,
        },
        json=body
    )
    return response.json()

# ใช้งาน
result = activate_license('LICENSE_KEY', 'my-laptop')
print(result)
```

---

## รหัสข้อผิดพลาด

- `200` - สำเร็จ
- `400` - ส่งข้อมูลไม่ครบ
- `403` - ไม่มีสิทธิ์ (หมดอายุ, ครบจำนวนเครื่อง)
- `404` - ไม่พบข้อมูล (รหัส license ผิด)
- `429` - เรียกบ่อยเกินไป รอสักครู่

---

## สิ่งที่ควรรู้

1. เก็บ API key และ secret ให้ปลอดภัย
2. ใช้ HTTPS ในระบบจริง
3. ถ้าเรียก API บ่อยเกินไป ให้รอสักครู่แล้วลองใหม่
4. สามารถเก็บผลการตรวจสอบไว้ชั่วคราว ไม่ต้องเรียกทุกครั้ง

---

ดูตัวอย่างโค้ดเต็มได้ที่โฟลเดอร์ `examples/`
