# 🚀 Деплой на GitHub Pages (5 минут)

## Шаг 1: Создай репозиторий на GitHub

1. Открой: https://github.com/new
2. Название: `box-ai`
3. Сделай **Public**
4. Нажми "Create repository"

## Шаг 2: Загрузи код

Выполни в терминале:

```bash
cd "/home/dronolyub/box ai"

# Инициализируй git
git init
git add .
git commit -m "Initial commit"

# Подключи к GitHub (замени USERNAME на свой)
git remote add origin https://github.com/USERNAME/box-ai.git
git branch -M main
git push -u origin main
```

## Шаг 3: Задеплой

```bash
npm run deploy
```

## Шаг 4: Включи GitHub Pages

1. Открой: https://github.com/USERNAME/box-ai/settings/pages
2. Source: выбери **gh-pages** branch
3. Нажми Save

## Шаг 5: Открой на телефоне

Через 1-2 минуты приложение будет доступно по адресу:

```
https://USERNAME.github.io/box-ai/
```

Открывай эту ссылку на телефоне! 🎉

---

## ⚡ Быстрая команда (всё в одном):

```bash
cd "/home/dronolyub/box ai"
git init
git add .
git commit -m "ShadowCoach AI"
# Замени USERNAME на свой GitHub username
git remote add origin https://github.com/USERNAME/box-ai.git
git branch -M main
git push -u origin main
npm run deploy
```

Потом включи GitHub Pages в настройках репозитория!

---

## 🆘 Нужна помощь?

Скажи на каком шаге застрял, помогу! 🚀
