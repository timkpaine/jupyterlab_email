jupyterlab_celltests
====================

Cell-by-cell testing for production Jupyter notebooks in JupyterLab

|Build Status| |PyPI| |PyPI| |npm|

Overview
========

``Celltests`` is designed for writing tests for linearly executed
notebooks. Its primary use is for report unit tests.

“Linearly executed notebooks?”
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When converting notebooks into html/pdf/email reports, they are executed
from top-to-bottom one time, and are expected contain as little code as
reasonably possible, focusing primarily on the plotting and markdown
bits. Libraries for this type of thing include
`Papermill <https://github.com/nteract/papermill>`__, `JupyterLab
Emails <https://github.com/timkpaine/jupyterlab_email>`__, etc.

Doesn’t this already exist?
~~~~~~~~~~~~~~~~~~~~~~~~~~~

`Nbval <https://github.com/computationalmodelling/nbval>`__ is a great
product and I recommend using it for notebook regression tests. But it
compares the executed notebook’s outputs to its existing outputs, which
doesn’t align well with dynamic reports which might be run everyday with
different input/output data.

So why do I want this again?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This doesn’t necessarily help you if your data sources go down, but its
likely you’ll notice this anyway. Where this comes in handy is:

-  when the environment (e.g. package versions) are changing in your
   system
-  when you play around in the notebook (e.g. nonlinear execution) but
   aren’t sure if your reports will still generate
-  when your software lifecycle systems have a hard time dealing with
   notebooks (can’t lint/audit them as code unless integrated
   nbdime/nbconvert to script, tough to test, tough to ensure what works
   today works tomorrow)

So what does this do?
~~~~~~~~~~~~~~~~~~~~~

Given a notebook, you can write mocks and assertions for individual
cells. You can then generate a testing script for this notebook,
allowing you to hook it into your testing system and thereby provide
unittests of your report.

Writing tests
-------------

When you write tests for a cell, we create a new method on a
``unittest`` class corresponding to the index of your cell, and
including the cumulative tests for all previous cells (to mimic what has
happened so far in the notebook’s linear execution). You can write
whatever mocking and asserts you like, and can call ``%cell`` to inject
the contents of the cell into your test. |image4| The tests themselves
are stored in the cell metadata, similar to celltags, slide information,
etc.

Running tests
-------------

You can run the tests offline from an ``.ipynb`` file, or you can
execute them from the browser and view the results of
``pytest-html``\ ’s html plugin. |image5|

Extra Tests
-----------

-  Max number of lines per cell
-  Max number of cells per notebook
-  Max number of function definitions per notebook
-  Max number of class definitions per notebook
-  Percentage of cells tested

Example
-------

In the committed ``Untitled.ipynb`` notebook, but modified so that cell
0 has its import statement copied 10 times (to trigger test and lint
failures):

Tests
~~~~~

.. code:: bash

   Untitled_test.py::TestExtension::test_cell0 PASSED                                                                                     [  8%]
   Untitled_test.py::TestExtension::test_cell1 PASSED                                                                                     [ 16%]
   Untitled_test.py::TestExtension::test_cell2 PASSED                                                                                     [ 25%]
   Untitled_test.py::TestExtension::test_cell3 PASSED                                                                                     [ 33%]
   Untitled_test.py::TestExtension::test_cell_coverage PASSED                                                                             [ 41%]
   Untitled_test.py::TestExtension::test_cells_per_notebook PASSED                                                                        [ 50%]
   Untitled_test.py::TestExtension::test_class_definition_count PASSED                                                                    [ 58%]
   Untitled_test.py::TestExtension::test_function_definition_count PASSED                                                                 [ 66%]
   Untitled_test.py::TestExtension::test_lines_per_cell_0 FAILED                                                                          [ 75%]
   Untitled_test.py::TestExtension::test_lines_per_cell_1 PASSED                                                                          [ 83%]
   Untitled_test.py::TestExtension::test_lines_per_cell_2 PASSED                                                                          [ 91%]
   Untitled_test.py::TestExtension::test_lines_per_cell_3 PASSED                                                                          [100%]

Lint
~~~~

.. code:: bash

   Checking lines in cell 0:   FAILED
   Checking lines in cell 1:   PASSED
   Checking lines in cell 2:   PASSED
   Checking lines in cell 3:   PASSED
   Checking cells per notebook <= 10:  PASSED
   Checking functions per notebook <= 10:  PASSED
   Checking classes per notebook <= 10:    PASSED
   Checking cell test coverage >= 50:  PASSED

.. |Build Status| image:: https://travis-ci.org/timkpaine/jupyterlab_celltests.svg?branch=master
   :target: https://travis-ci.org/timkpaine/jupyterlab_celltests
.. |PyPI| image:: https://img.shields.io/pypi/l/jupyterlab_celltests.svg
   :target: https://pypi.python.org/pypi/jupyterlab_celltests
.. |PyPI| image:: https://img.shields.io/pypi/v/jupyterlab_celltests.svg
   :target: https://pypi.python.org/pypi/jupyterlab_celltests
.. |npm| image:: https://img.shields.io/npm/v/jupyterlab_celltests.svg
   :target: https://www.npmjs.com/package/jupyterlab_celltests
.. |image4| image:: https://raw.githubusercontent.com/timkpaine/jupyterlab_celltests/master/docs/demo.gif
.. |image5| image:: https://raw.githubusercontent.com/timkpaine/jupyterlab_celltests/master/docs/demo2.gif

jupyterlab_email
================

A jupyterlab extension to email notebooks from the browser.

|Build Status| |GitHub issues| |codecov| |PyPI| |PyPI| |npm|

|image6|

Options
-------

-  Inline notebook as email, with code
-  Inline notebook as email, without code
-  Send notebook as HTML attachment, with code
-  Send notebook as HTML attachment, without code
-  Send notebook as PDF attachment, with code
-  Send notebook as PDF attachment, without code
-  Attach output data as CSV, TSV, PDF, PNG, or Excel Spreadsheet

Install
-------

.. code:: bash

   pip install jupyterlab_email
   jupyter labextension install jupyterlab_email
   jupyter serverextension enable --py jupyterlab_email

Adding templates
----------------

install the server extension, and add the following to
``jupyter_notebook_config.py``

.. code:: python3

   c.JupyterLabEmail.smtp_servers = [{'name': 'gmail',
                                      'domain': 'gmail.com',
                                      'username': '<YOUR USERNAME>',
                                      'smtp': 'smtp.gmail.com',
                                      'port': 465}]

Create email from notebook:
---------------------------

Use the function in ``jupyterlab_email._email``

.. code:: python3

   def make_email(path, model, from_, type='email', template='', code=False, subject='',
                  also_attach='none', also_attach_pdf_template='', also_attach_html_template=''):
       '''
           path        : path to notebook
           model       : notebook itself (in case deployment strips outputs or
                         notebook not available except through ContentsManager)
           from_       : address to send the email from
           type        : type to convert notebook to
           template    : template to use when converting notebook
           code        : include input cells in notebook
           subject     : subject of email
           also_attach : also attach pdf/html/both
       '''

Attach dataframe as csv or spreadsheet
--------------------------------------

In ``jupyterlab_email.attachments``

.. code:: python3

   def attach(data, filename, type):

Modify ``jupyterlab_email.attachments.EXCEL_ENGINE`` to use a different
excel writer (defaults to ``xlsxwriter``)

Inline LaTeX
------------

In ``jupyterlab_email.attachments``

.. code:: python3


   def latex(expression):
       import matplotlib.pyplot as plt
       fig, ax = plt.subplots(figsize=(10, 1))
       ax.xaxis.set_visible(False)
       ax.yaxis.set_visible(False)
       ax.axis('off')
       plt.text(0, 0.6, r'$%s$' % expression, fontsize=25)
       plt.show()

.. |Build Status| image:: https://travis-ci.org/timkpaine/jupyterlab_email.svg?branch=master
   :target: https://travis-ci.org/timkpaine/jupyterlab_email
.. |GitHub issues| image:: https://img.shields.io/github/issues/timkpaine/jupyterlab_email.svg
   :target: 
.. |codecov| image:: https://codecov.io/gh/timkpaine/jupyterlab_email/branch/master/graph/badge.svg
   :target: https://codecov.io/gh/timkpaine/jupyterlab_email
.. |PyPI| image:: https://img.shields.io/pypi/l/jupyterlab_email.svg
   :target: https://pypi.python.org/pypi/jupyterlab_email
.. |PyPI| image:: https://img.shields.io/pypi/v/jupyterlab_email.svg
   :target: https://pypi.python.org/pypi/jupyterlab_email
.. |npm| image:: https://img.shields.io/npm/v/jupyterlab_email.svg
   :target: https://www.npmjs.com/package/jupyterlab_email
.. |image6| image:: https://raw.githubusercontent.com/timkpaine/jupyterlab_email/master/docs/example.gif

