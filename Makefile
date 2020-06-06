all:
# 	git submodule update --init
	make reinstall
	make rebuild

rebuild:
	rm -rf dist/bin dist/libs && tsc
	make deps

build:
	tsc
	make deps

dep:
	cp -f $(t)/package.json dist/$(t)/
	cd dist/$(t) && rm -f package-lock.json && npm i

deps:
	make dep t=libs/sota-common
# 	make dep t=libs/sota-btc
# 	make dep t=libs/sota-eos
# 	make dep t=libs/sota-bch
# 	make dep t=libs/sota-ltc
	make dep t=libs/sota-eth
# 	make dep t=libs/sota-xrp
# 	make dep t=libs/sota-ada
	make dep t=libs/wallet-core
# 	make dep t=bin/eos
# 	make dep t=bin/btc
# 	make dep t=bin/bch
# 	make dep t=bin/ltc
# 	make dep t=bin/eth
# 	make dep t=bin/xrp
# 	make dep t=bin/ada
	make dep t=bin/common
	make dep t=bin/typeorm_migration

ts-dep-reinstall:
	cd $(t) && rm -rf node_modules package-lock.json && npm i

ts-dep-install:
	cd $(t) && rm -rf package-lock.json && npm i

ts-deps:
	make ts-dep-install t=./
	make ts-dep-install t=libs/sota-common
# 	make ts-dep-install t=libs/sota-btc
# 	make ts-dep-install t=libs/sota-eos
# 	make ts-dep-install t=libs/sota-bch
# 	make ts-dep-install t=libs/sota-ltc
	make ts-dep-install t=libs/sota-eth	
# 	make ts-dep-install t=libs/sota-xrp	
# 	make ts-dep-install t=libs/sota-ada	
	make ts-dep-install t=libs/wallet-core
# 	make ts-dep-install t=bin/btc
# 	make ts-dep-install t=bin/bch
# 	make ts-dep-install t=bin/ltc
# 	make ts-dep-install t=bin/eos
	make ts-dep-install t=bin/eth
# 	make ts-dep-install t=bin/xrp
# 	make ts-dep-install t=bin/ada
	make ts-dep-install t=bin/common
	make ts-dep-install t=bin/typeorm_migration

ts-deps-reinstall:
	make ts-dep-reinstall t=./
	make ts-dep-reinstall t=libs/sota-common
# 	make ts-dep-reinstall t=libs/sota-btc
# 	make ts-dep-reinstall t=libs/sota-eos
# 	make ts-dep-reinstall t=libs/sota-bch
# 	make ts-dep-reinstall t=libs/sota-ltc
	make ts-dep-reinstall t=libs/sota-eth
# 	make ts-dep-reinstall t=libs/sota-xrp
# 	make ts-dep-reinstall t=libs/sota-ada
	make ts-dep-reinstall t=libs/wallet-core
	make ts-dep-reinstall t=bin/typeorm_migration
# 	make ts-dep-reinstall t=bin/eos
# 	make ts-dep-reinstall t=bin/btc
# 	make ts-dep-reinstall t=bin/bch
# 	make ts-dep-reinstall t=bin/ltc
	make ts-dep-reinstall t=bin/eth
# 	make ts-dep-reinstall t=bin/xrp
# 	make ts-dep-reinstall t=bin/ada
	make ts-dep-reinstall t=bin/common

install:
	make ts-deps

reinstall:
	make ts-deps-reinstall

migrations:
	cd bin/typeorm_migration && npm run migrations

deploy-205:
	rsync -avhzL --delete \
	-O \
				--no-perms --no-owner --no-group \
				--exclude .git \
				--filter=":- .gitignore" \
				. sotatek@192.168.1.205:/var/www/amanpuri-wallet
deploy-client-main:
	rsync -avhzL --delete \
	-O \
				--no-perms --no-owner --no-group \
				--exclude .git \
				--filter=":- .gitignore" \
				. ubuntu@13.231.73.95:wallet		
deploy-client-test:
	rsync -avhzL --delete \
	-O \
				--no-perms --no-owner --no-group \
				--exclude .git \
				--filter=":- .gitignore" \
				. ubuntu@18.176.228.225:wallet							
deploy-205-full:
	make deploy-205
	ssh sotatek@192.168.1.207 "cd /var/www/amanpuri-wallet && make all && pm2 start app.json"

deploy-205-lite:
	make deploy-205
	ssh sotatek@192.168.1.207 "cd /var/www/amanpuri-wallet && make all && pm2 start app.json"
