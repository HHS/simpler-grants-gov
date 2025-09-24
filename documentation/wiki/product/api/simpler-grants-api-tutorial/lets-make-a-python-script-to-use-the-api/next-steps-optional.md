# Next Steps (optional)

Now that you have a working script to access the Simpler.Grants.gov API let's make some changes and see how it effects the response data.&#x20;

* Change `page_size` to 25 to see more results per request
* Replace `"health"` with you own keyword(s), e.g. `"education"` or `"rural broadband"`
* When you run the script, try piping the output to a file to easily save it. `python3 search_opportunities.py > results.txt`

## Next-step ideas to level up your script

### Read the API key from an environment variable

It is safer than hard-coding your API key into the script. Try adding this import and variable to the top of your script.&#x20;

```python
import os
API_KEY = os.getenv("SGG_API_KEY", "")
```

Then when you run it, you first need to add your API key to the environment:

{% tabs %}
{% tab title="Windows(PowerShell)" %}
```powershell
$env:SGG_API_KEY='your_key_here'
```
{% endtab %}

{% tab title="macOS/Linux" %}
```bash
export SGG_API_KEY=your_key_here
```
{% endtab %}
{% endtabs %}

### Add a real command-line interface

Try adding these changes to your code so that users can pass query, page size and sort options without needing to edit the code.&#x20;

```python
import argparse

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("query", nargs="*", help="optional keywords")
    p.add_argument("--page-size", type=int, default=10)
    p.add_argument("--sort-by", default="post_date")
    p.add_argument("--sort-dir", choices=["ascending","descending"], default="descending")
    return p.parse_args()

if __name__ == "__main__":
    args = parse_args()
    term = " ".join(args.query)
    search_opportunities(term, page_size=args.page_size, order_by=args.sort_by, sort_direction=args.sort_dir)

```

You could then run the script with command line arguments like `python search_opportunities.py health --sort-dir ascending`
