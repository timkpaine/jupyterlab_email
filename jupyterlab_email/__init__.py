from .nbconvert import run as run_nbconvert
from ._email import email as email_notebook
from .attachments import attach, latex
from ._version import __version__
from .extension import load_jupyter_server_extension


def _jupyter_server_extension_paths():
    return [{"module": "jupyterlab_email.extension"}]
