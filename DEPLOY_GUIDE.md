# 🚀 Деплой ShadowCoach AI на Vercel (БЕСПЛАТНО)

## Проблема: Роутер блокирует соединения между устройствами

Решение: Задеплоим на Vercel — получишь публичную ссылку типа `https://shadowcoach-ai.vercel.app`

---

## 📦 Способ 1: Через Vercel CLI (5 минут)

### Шаг 1: Зарегистрируйся на Vercel
1. Открой: https://vercel.com/signup
2. Войди через GitHub (или email)

### Шаг 2: Установи Vercel CLI
```bash
npm install -g vercel
```

### Шаг 3: Задеплой
```bash
cd "/home/dronolyub/box ai"
vercel login
vercel --prod
```

### Шаг 4: Получи ссылку
После деплоя увидишь:
```
✅ Production: https://shadowcoach-ai.vercel.app
```

Открывай эту ссылку на телефоне! 🎉

---

## 🌐 Способ 2: Через GitHub + Vercel (без CLI)

### Шаг 1: Загрузи на GitHub
```bash
cd "/home/dronolyub/box ai"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ТвойUsername/shadowcoach-ai.git
git push -u origin main
```

### Шаг 2: Подключи к Vercel
1. Открой: https://vercel.com/new
2. Выбери свой GitHub репозиторий
3. Нажми "Deploy"
4. Готово! Получишь ссылку

---

## 📱 Способ 3: Netlify Drop (самый простой)

### Шаг 1: Собери проект
```bash
cd "/home/dronolyub/box ai"
npm run build
```

### Шаг 2: Перетащи папку
1. Открой: https://app.netlify.com/drop
2. Перетащи папку `dist/` в окно браузера
3. Получи ссылку типа: `https://shadowcoach-ai.netlify.app`

---

## ⚡ Способ 4: Surge.sh (30 секунд)

```bash
npm install -g surge
cd "/home/dronolyub/box ai"
npm run build
cd dist
surge
```

Введи email, придумай домен (например: `shadowcoach-ai.surge.sh`)

Готово! Открывай на телефоне! 🥊

---

## 🎯 Рекомендация:

**Используй Netlify Drop** — самый быстрый способ без регистрации CLI!

1. `npm run build`
2. Открой https://app.netlify.com/drop
3. Перетащи папку `dist/`
4. Получи ссылку
5. Открой на телефоне

---

## ❓ Нужна помощь?

Скажи какой способ выбрал, помогу с деплоем! 🚀
