[English](README.md) | [Русский](README.ru.md)

# I-DOC: Document Recognition Ecosystem

<p align="center">
  <img src="./demo.gif" width="320" alt="App Demo" />
</p>

> **DISCLAIMER**
> This repository contains a document recognition system. The `generator` module creates synthetic images with non-existent data for testing and demonstration purposes. Every generated image contains a prominent watermark "ОБРАЗЕЦ" (SAMPLE) and is not a valid document. The project is not intended for creating forged documents, bypassing KYC, or any illegal activities. Use it at your own risk.

**I-DOC** is a document recognition ecosystem designed to extract and process Machine Readable Zone (MRZ) data from Russian internal passports. The project consists of three independent modules combined into a monorepo.

## Modules

*   **`backend/`** — REST API built with FastAPI. Receives images, extracts text using OCR (OmniMRZ), and applies custom parsing rules based on the document type.
*   **`mobile/`** — Cross-platform mobile application built with React Native (Expo). Provides the UI for user authentication, document scanning, and displaying parsed results.
*   **`generator/`** — Python script for generating synthetic test data. Creates passport images with valid MRZ checksums, watermarks, and visual noise to simulate real-world scanning conditions.

## Key Features

*   **Domain-Specific MRZ Standards:** Implements the exact "modernized Clear" character mapping and 7-3-1 check digit calculation mandated by the Russian Ministry of Internal Affairs (Order No. 773, Appendix 24) for internal passports.
*   **Extensible Architecture (Strategy Pattern):** The parsing logic is built on an abstract `MRZRuleSet` base class. This allows easy switching or adding of parsing rules for different document types (e.g., international passports) without modifying the existing codebase.
*   **Security:** JWT-based authentication with role separation (mobile user vs. admin). The initial admin is bootstrapped via environment variables on server startup to prevent unauthorized admin registration.
*   **Data Generation:** The Python script overlays valid MRZ text onto a template, adding noise and blur to simulate smartphone camera conditions (testing OCR robustness against noisy inputs).

## Tech Stack

*   **Mobile:** React Native, Expo, React Navigation, React Native Paper.
*   **Backend:** Python, FastAPI, SQLAlchemy (SQLite), PyJWT, Passlib (bcrypt), OmniMRZ.
*   **Generator:** Python, PIL (Pillow), NumPy.

## How to run

### Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

*Note: To create the first administrator, pass the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables before starting the server.*

**Windows (PowerShell):**
```powershell
$env:ADMIN_USERNAME="admin"; $env:ADMIN_PASSWORD="yourpassword"; uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Linux / macOS:**
```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=yourpassword uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile

**For local development:**
```bash
cd mobile
npm install
npm start
```

**To build an APK (for testing on a real device):**
First, make sure you have the EAS CLI installed and you are logged in:
```bash
npm install -g eas-cli
eas login
```

Since the backend runs locally, you need to provide your local IP address to the app. Set it as an environment variable in your EAS project:
```bash
eas env:set --name EXPO_PUBLIC_BACKEND_URL --value "http://YOUR_LOCAL_IP:8000" --environment preview --visibility plaintext
```
*(Replace `YOUR_LOCAL_IP` with your computer's IP address, e.g., `192.168.1.42`)*

Then, run the build:
```bash
eas build --profile preview --platform android
```

### Generator
```bash
cd generator
pip install -r requirements.txt
python generator.py
```
*Generated images will be saved in the `output/` directory.*

## License

This project uses a split-license model:
*   **`backend/` and `mobile/`** are licensed under the **MIT License**.
*   **`generator/`** is licensed under **CC BY-NC-SA 4.0** (Non-Commercial). Commercial use is prohibited. Any derivative works must retain the watermarks and be distributed under the same license.

## Credits

*   **OmniMRZ** (Apache 2.0) for the open-source MRZ recognition pipeline.
*   **React Native Paper** for the Material Design components.

---
*Developed by voidHedge*