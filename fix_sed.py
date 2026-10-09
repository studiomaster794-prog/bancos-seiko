import re
with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

# Remove the trailing single quote from each line
text = re.sub(r"'\n", "\n", text)
# And the very last line if it has it
if text.endswith("'"):
    text = text[:-1]

# Also fix the original SyntaxError that caused me to run sed
text = text.replace(r"negative?\'negative\':\'\'", r"negative?'negative':''")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(text)
