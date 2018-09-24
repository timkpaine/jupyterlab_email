from .nbconvert import run as run_nbconvert
from ._email import email as email_notebook
from .attachments import attach, latex


def _jupyter_server_extension_paths():
    return [{
        "module": "jupyterlab_email.extension"
    }]

__version__ = '0.1.1'
