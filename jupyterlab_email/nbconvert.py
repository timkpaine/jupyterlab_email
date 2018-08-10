# from nbconvert.nbconvertapp import NbConvertApp
import sys
import os
import os.path
import tempfile
import subprocess


def run(to='html', name='', in_='', template='', execute=False, execute_timeout=600):
    # write notebook string to disk
    _dir = tempfile.mkdtemp()
    inname = os.path.join(_dir, name)
    with open(inname, 'w') as fp:
        fp.write(in_)

    # output file name
    outname = name.rsplit('.', 1)[0]

    # hack for pdfs
    if to != 'pdf':
        outname += '.' + to

    # assemble nbconvert command
    argv = []
    argv = [sys.executable, '-m', 'nbconvert', '--to', to]

    # reexecute if needed
    if execute:
        argv.extend(['--execute', '--ExecutePreprocessor.timeout=' + str(execute_timeout)])

    # pass in template arg
    if template:
        argv.extend(['--template', template])

    # output to outname
    argv.extend([inname, '--output', outname])

    try:
        subprocess.call(argv)
        outname = os.path.join(_dir, outname)

        # hack for pdfs
        if to == 'pdf':
            outname += '.' + to

        with open(outname, 'rb') as fp:
            ret = fp.read()

        os.remove(outname)
        os.remove(inname)
        return ret

    except Exception as e:
        print(e)
        return None
