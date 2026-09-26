# Le site est statique : un serveur de fichiers, et rien du site ne change pour lui.
FROM caddy:2-alpine

# Seulement ce que la page charge, plus la version servie (écrite par la livraison depuis le tag).
# tests/livraison.test.js vérifie que tout ce que index.html charge est copié ici.
COPY index.html favicon.svg version.txt /srv/
COPY css/ /srv/css/
COPY js/ /srv/js/

# Railway donne le port par $PORT ; « :port » écoute sur toutes les interfaces. exec : Caddy est le
# PID 1 et reçoit l'arrêt.
CMD ["sh", "-c", "exec caddy file-server --root /srv --listen :${PORT:-8080}"]
