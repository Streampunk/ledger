FROM    nodesource/trusty:4.1

# Install app dependencies
COPY package.json /src/package.json
RUN cd /src; npm install --production

# Bundle app source
COPY . /src

EXPOSE  3001 3002 
CMD ["node", "/src/bin/nmos-ledger"]