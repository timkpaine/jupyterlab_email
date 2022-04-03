from jupyterlab_email import _jupyter_server_extension_paths


class TestInit:
    def test__jupyter_server_extension_paths(self):
        assert _jupyter_server_extension_paths() == [
            {"module": "jupyterlab_email.extension"}
        ]
