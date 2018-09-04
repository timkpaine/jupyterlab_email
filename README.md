# jupyterlab_email
A jupyterlab extension to email notebooks from the browser.

[![Build Status](https://travis-ci.org/timkpaine/jupyterlab_email.svg?branch=master)](https://travis-ci.org/timkpaine/jupyterlab_email)
[![GitHub issues](https://img.shields.io/github/issues/timkpaine/jupyterlab_email.svg)]()
[![codecov](https://codecov.io/gh/timkpaine/jupyterlab_email/branch/master/graph/badge.svg)](https://codecov.io/gh/timkpaine/jupyterlab_email)
[![PyPI](https://img.shields.io/pypi/l/jupyterlab_email.svg)](https://pypi.python.org/pypi/jupyterlab_email)
[![PyPI](https://img.shields.io/pypi/v/jupyterlab_email.svg)](https://pypi.python.org/pypi/jupyterlab_email)
[![npm](https://img.shields.io/npm/v/jupyterlab_email.svg)](https://www.npmjs.com/package/jupyterlab_email)

![](https://raw.githubusercontent.com/timkpaine/jupyterlab_email/master/docs/example.gif)

## Options
- Inline notebook as email, with code
- Inline notebook as email, without code
- Send notebook as HTML attachment, with code
- Send notebook as HTML attachment, without code
- Send notebook as PDF attachment, with code
- Send notebook as PDF attachment, without code
- Attach output data as CSV, TSV, PDF, PNG, or Excel Spreadsheet

## Install
```bash
pip install jupyterlab_email
jupyter labextension install jupyterlab_email
jupyter serverextension enable --py jupyterlab_email
```

## Adding templates
install the server extension, and add the following to `jupyter_notebook_config.py`

```python3
c.JupyterLabEmail.smtp_servers = [{'name': 'gmail',
                                   'domain': 'gmail.com',
                                   'username': '<YOUR USERNAME>',
                                   'smtp': 'smtp.gmail.com',
                                   'port': 465}]

```
