from .nbconvert import run as run_nbconvert  # noqa: F401
from ._email import email as email_notebook  # noqa: F401
from .attachments import attach, latex  # noqa: F401


def _jupyter_server_extension_paths():
    return [{
        "module": "jupyterlab_email.extension"
    }]


__version__ = '0.2.0'
