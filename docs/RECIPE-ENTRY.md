# Entering recipes

A short guide for whoever types recipes into Spongecake. The admin is at
`/admin` on the site's address. Sign in with your email code; there is no password.

## Before you start

- Ask James or the head chef to make you a **Site Admin**. That lets you set the
  author of each recipe to the chef who wrote it, instead of yourself.
- Have the tags agreed (Starters, Mains, Sauces and so on). Tags drive the home
  page sections. Add missing ones under Tags before you need them.

## One recipe

1. **Recipes → Create new.** Give it the title the kitchen uses.
2. **Author.** In the sidebar, pick the chef who wrote the recipe.
3. **Yield.** The number the recipe makes and what the unit is: `12 portions`,
   `1 litre`, `2 trays`, `500 grams`. Use whatever the kitchen says when it
   makes the recipe. Scaling works from this number.
4. **Ingredients.** One section is fine. Add a second section only when the
   recipe has parts, like "For the sauce" and "To finish".
   - **Quantity** is a number. Leave it empty for things with no amount.
   - **Unit:** g, kg, ml, l, tsp, tbsp, each, pinch, bunch, sheet, none. Pick
     "other" and type a label for anything else.
   - **Item** is the ingredient name, lowercase unless it is a proper name.
   - **Note** is the prep: `peeled`, `finely diced`, `room temperature`. Keep it
     short; it shows after a comma.
   - **Scales** is on by default. Untick it for things that should not change
     when the batch is doubled, like "salt, to taste". These show "Not scaled".
   - **Sub-recipe.** If an ingredient is another recipe in the system (house
     mayonnaise, garlic butter), pick it under Sub-recipe and leave Item empty.
     The front end links to it.
5. **Method.** One step per entry. Start each step with the action (“Whisk the
   yolks…”). Bold a lead phrase if it helps scanning. Links to other recipes are
   allowed. Add a photo to a step only if it genuinely helps.
6. **Notes.** Shelf life, storage, service notes. Optional.
7. **Tags.** At least one. The first tag decides which home section it sits in.
8. **Hero image.** Optional. Landscape, at least 1600px wide.
9. **Save as draft** until a chef has checked it, then **Publish**. Drafts are
   invisible on the front end.

## Editing a published recipe

- Write a **change note** in the sidebar before saving ("Oven temp 160→150 after
  new Rational"). It appears in the recipe's History.
- Saving a published recipe publishes the change straight away. To work on a
  bigger rewrite, save as draft; the published version stays live until you
  publish again.

## Conventions

- Quantities in metric. Temperatures in °C. Times in minutes.
- Decimal points, not fractions: `0.5`, not `½`.
- Don't put quantities in the item name; put them in Quantity and Unit, or
  scaling will miss them.
- Archive, don't delete. The Archived tick box in the sidebar hides a recipe
  from the front end but keeps it and its history.
