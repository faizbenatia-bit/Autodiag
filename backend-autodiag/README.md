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

## Importer le catalogue OBD-II générique

Depuis `backend-autodiag`, exécutez `npm run import-obd-catalog` pour importer
les 9 533 codes OBD-II génériques (familles P0, P2, P3, B0, C0, U0 et U3) dans
MongoDB. Le catalogue est issu d'OBDex, publié sous licence de données CC0 1.0,
et les descriptions importées sont en anglais : le titre est enregistré comme
résumé et la description complète comme détail. Les résumés des codes déjà
présents sont actualisés depuis la source, mais leurs détails ne sont pas
écrasés, sauf pour P0300, P0420 et P0171. Exécutez cette commande après
`npm run seed` si nécessaire. Elle peut être relancée sans créer de doublons.

Source : [OBDex](https://github.com/foerbsnavi/OBDex), révision
`5563d7b1f08620b0b265da62cf9f02f6b8ed382c`.

## Gestion des utilisateurs

Depuis la section **Utilisateurs** du tableau de bord, un administrateur peut
consulter et modifier les comptes non administrateurs. La désactivation bloque
la connexion et les requêtes authentifiées tout en conservant le compte, ses
véhicules et ses diagnostics. La suppression est définitive et supprime aussi
les véhicules et diagnostics associés.
