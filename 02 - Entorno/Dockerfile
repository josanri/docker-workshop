FROM alpine:3.17.3

RUN apk add --no-cache gnupg

COPY  theAnswer.gpg /theAnswer/theAnswer.gpg

ENV THEANSWERTOLIFE=$THEANSWERTOLIFE

CMD echo -e "$THEANSWERTOLIFE\n" | gpg --batch --passphrase-fd 0 --no-tty -o /theAnswer/theAnswer -d /theAnswer/theAnswer.gpg && cat /theAnswer/theAnswer

