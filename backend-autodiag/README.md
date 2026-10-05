# AutoDiag backend

## Créer le compte administrateur

L'inscription publique crée uniquement des comptes utilisateur. Pour créer le
compte administrateur initial, définissez ces variables d'environnement dans
l'environnement du backend :

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (8 caractères minimum)

Puis, depuis `backend-autodiag`, exécutez `npm run create-admin`. La commande
refuse de créer un deuxième administrateur ou d'attribuer un rôle admin à un
email déjà utilisé. Ne partagez pas le mot de passe et ne le stockez pas dans
le dépôt.

Après connexion avec ce compte, le tableau de bord est accessible à
`/admin`. Les statistiques et l'ajout de codes OBD sont protégés côté serveur
par authentification et vérification du rôle.
