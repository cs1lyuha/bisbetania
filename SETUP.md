# BisBetania — Запуск

## 1. Установка зависимостей
```bash
cd bisbetania
npm install
```

## 2. Запуск на Android-эмуляторе
```bash
npx expo start --android
```

## 3. Вставить реальную MIA ссылку
Открой `config/links.ts` и замени:
```ts
mia: 'https://mia.md/transfer/XXXXXXXXXX'
```

## 4. Добавить QR-код (когда будет готов)
1. Положи файл `qr-code.png` в папку `assets/images/`
2. В `app/index.tsx` найди комментарий `QR PLACEHOLDER`
3. Замени `<View>` блок на:
```tsx
<Image
  source={require('../assets/images/qr-code.png')}
  style={{ width: 200, height: 200, borderRadius: 12 }}
  resizeMode="contain"
/>
```
Не забудь добавить `import { Image } from 'react-native';` вверху файла.

## 5. Добавить логотип (когда будет готов)
1. Положи `logo.png` в `assets/images/`
2. В `app/index.tsx` найди комментарий `LOGO PLACEHOLDER`
3. Замени `<View>` блок на:
```tsx
<Image
  source={require('../assets/images/logo.png')}
  style={{ width: 96, height: 96, borderRadius: 48 }}
/>
```
