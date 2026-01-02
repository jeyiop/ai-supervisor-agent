# Guide de Sécurité - AI Supervisor Agent

Ce guide explique comment protéger vos données et vos comptes.

---

## Les 3 règles d'or

### 1. Ne JAMAIS partager ces fichiers

| Fichier | Contient |
|---------|----------|
| `config/cookies.json` | Vos identifiants de session |
| `config/sessions.json` | Vos configurations privées |
| `.env.local` | Vos variables secrètes |

Ces fichiers sont déjà dans `.gitignore` = ils ne seront PAS envoyés sur GitHub.

### 2. Ne JAMAIS partager vos tokens GitHub

Un token GitHub (commence par `ghp_`) donne accès à votre compte.

**Si vous avez partagé un token par erreur :**
1. Allez sur https://github.com/settings/tokens
2. Trouvez le token concerné
3. Cliquez "Delete" pour le supprimer
4. Créez-en un nouveau si besoin

### 3. Vérifier avant de publier

Avant chaque `git push`, vérifiez qu'il n'y a pas de secrets dans vos fichiers :
- Pas de mots de passe
- Pas de tokens
- Pas de cookies

---

## Comment créer un token GitHub sécurisé

1. Allez sur : https://github.com/settings/tokens?type=beta
2. Cliquez "Generate new token"
3. Donnez un nom clair (ex: "AI Supervisor - Mon PC")
4. Choisissez une expiration (90 jours recommandé)
5. Sélectionnez UNIQUEMENT les permissions nécessaires :
   - `repo` - Pour accéder à vos dépôts
6. Cliquez "Generate token"
7. **Copiez le token IMMÉDIATEMENT** - il ne sera plus visible après

---

## Fichiers protégés automatiquement

Le fichier `.gitignore` empêche ces fichiers d'être partagés :

```
# Secrets - JAMAIS partagés
config/cookies.json
config/sessions.json
.env
.env.local

# Dépendances - Pas besoin de les partager
node_modules/

# Build - Fichiers générés
dist/
build/
```

---

## Que faire si j'ai partagé un secret ?

### Token GitHub exposé
1. Supprimez-le immédiatement : https://github.com/settings/tokens
2. Créez-en un nouveau
3. GitHub peut aussi le détecter et vous alerter

### Cookies exposés
1. Déconnectez-vous de tous les services (ChatGPT, Claude, etc.)
2. Reconnectez-vous
3. Les anciens cookies seront invalides

### Fichier .env exposé
1. Changez toutes les valeurs sensibles
2. Si c'est une clé API, régénérez-la

---

## Bonnes pratiques

| Faire | Ne pas faire |
|-------|--------------|
| Utiliser des fichiers `.example` | Mettre de vrais secrets dans les exemples |
| Vérifier `.gitignore` existe | Supprimer `.gitignore` |
| Créer des tokens avec expiration | Créer des tokens permanents |
| Donner des permissions minimales | Donner toutes les permissions |

---

## Contact

Si vous avez un doute sur la sécurité, n'hésitez pas à demander de l'aide !
