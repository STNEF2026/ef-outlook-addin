"""Write manifest.xml for the address where the add-in files are hosted.
Usage: python3 make_manifest.py https://executiveforecast.com/outlook-addin
"""
import sys, re
host = (sys.argv[1] if len(sys.argv) > 1 else '').rstrip('/')
if not re.match(r'^https://[^\s]+$', host):
    sys.exit('Give the https:// address where taskpane.html will live, e.g. https://executiveforecast.com/outlook-addin')
xml = open('manifest.template.xml', encoding='utf-8').read().replace('{{HOST}}', host)
open('manifest.xml', 'w', encoding='utf-8').write(xml)
print('manifest.xml written for', host)
