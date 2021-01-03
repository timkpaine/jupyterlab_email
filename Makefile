testjs: ## Clean and Make js tests
	cd js; yarn test

testpy: ## Clean and Make unit tests
	python -m pytest -v jupyterlab_email/tests --cov=jupyterlab_email

tests: lint ## run the tests
	python -m pytest -v jupyterlab_email/tests --cov=jupyterlab_email --junitxml=python_junit.xml --cov-report=xml --cov-branch
	cd js; yarn test

lint: ## run linter
	python -m flake8 jupyterlab_email setup.py
	cd js; yarn lint

fix:  ## run autopep8/tslint fix
	python -m black jupyterlab_email/ setup.py
	cd js; yarn fix

clean: ## clean the repository
	find . -name "__pycache__" | xargs  rm -rf
	find . -name "*.pyc" | xargs rm -rf
	find . -name ".ipynb_checkpoints" | xargs  rm -rf
	rm -rf .coverage coverage cover htmlcov logs build dist *.egg-info lib node_modules
	# make -C ./docs clean

docs:  ## make documentation
	make -C ./docs html
	open ./docs/_build/html/index.html

install:  ## install to site-packages
	python -m pip install .

serverextension: install ## enable serverextension
	python -m jupyter serverextension enable --py jupyterlab_email

js:  ## build javascript
	cd js; yarn
	cd js; yarn build

labextension: js ## enable labextension
	cd js; python -m jupyter labextension install .

dist: js  ## create dists
	rm -rf dist build
	python setup.py sdist bdist_wheel
	python -m twine check dist/*

publish: dist  ## dist to pypi and npm
	python -m twine upload dist/* --skip-existing
	cd js; npm publish || echo "can't publish - might already exist"

# Thanks to Francoise at marmelab.com for this
.DEFAULT_GOAL := help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

print-%:
	@echo '$*=$($*)'

.PHONY: clean install serverextension labextension test tests help docs dist js
