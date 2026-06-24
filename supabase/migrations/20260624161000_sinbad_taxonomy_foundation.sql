create or replace function public.sinbad_taxonomy_slug(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

with taxonomy(category_name, category_sort, children) as (
  values
    ('Grocery & Food', 10, array[
      'Rice & Grains','Pasta & Noodles','Canned Food','Sauces & Condiments','Cooking Oil & Ghee','Spices & Seasonings','Sugar & Sweeteners','Flour & Baking','Breakfast Foods','Snacks','Chocolate & Candy','Biscuits & Cookies','Chips & Savory Snacks','Nuts & Seeds','Dates & Dried Fruits','Honey & Jams','Pickles & Olives','Instant Meals','International Food','Filipino Food','Indian Food','Arabic Food','Frozen Food','Frozen Vegetables','Frozen Meat & Poultry','Frozen Seafood','Dairy & Eggs','Cheese','Yogurt','Butter & Cream'
    ]),
    ('Beverages', 20, array[
      'Water','Sparkling Water','Soft Drinks','Juices','Energy Drinks','Sports Drinks','Tea','Coffee','Instant Coffee','Hot Chocolate','Powdered Drinks','Non-Alcoholic Malt Drinks'
    ]),
    ('Beauty & Personal Care', 30, array[
      'Shampoo','Conditioner','Hair Treatment','Hair Styling','Hair Color','Body Wash','Soap','Hand Wash','Skin Care','Face Care','Moisturizers','Sunscreen','Deodorants','Perfumes & Fragrances','Oral Care','Toothpaste','Toothbrushes','Shaving & Grooming','Feminine Care','Cotton & Tissues','Personal Hygiene'
    ]),
    ('Baby & Kids', 40, array[
      'Diapers','Baby Wipes','Baby Food','Baby Milk Accessories','Baby Skin Care','Baby Bath','Baby Bottles','Pacifiers','Baby Feeding','Baby Cleaning','Kids Snacks','Kids Personal Care','Baby Toys'
    ]),
    ('Household & Cleaning', 50, array[
      'Laundry Detergent','Fabric Softener','Dishwashing','Surface Cleaners','Floor Cleaners','Bathroom Cleaners','Kitchen Cleaners','Glass Cleaners','Disinfectants','Air Fresheners','Garbage Bags','Paper Towels','Tissues','Toilet Paper','Cleaning Tools','Sponges & Brushes','Insect Control'
    ]),
    ('Home & Kitchen', 60, array[
      'Cookware','Bakeware','Food Storage','Kitchen Tools','Dinnerware','Drinkware','Cutlery','Kitchen Organization','Home Organization','Bedding','Towels','Bathroom Accessories','Home Decor','Lighting','Small Home Appliances'
    ]),
    ('Electronics', 70, array[
      'Mobile Phones','Tablets','Laptops','Desktop Computers','Monitors','Printers & Scanners','Cameras','Audio','Speakers','Headphones','Smart Watches','Gaming Accessories','Computer Accessories','Networking','Cables & Adapters'
    ]),
    ('Mobile Accessories', 80, array[
      'Phone Cases','Screen Protectors','Chargers','Charging Cables','Power Banks','Car Chargers','Earphones','Phone Holders','Memory Cards','Smartwatch Accessories'
    ]),
    ('Fashion', 90, array[
      'Men Clothing','Women Clothing','Kids Clothing','Sportswear','Underwear','Sleepwear','Traditional Clothing','Accessories','Belts','Hats & Caps','Scarves'
    ]),
    ('Shoes & Bags', 100, array[
      'Men Shoes','Women Shoes','Kids Shoes','Sports Shoes','Sandals','Slippers','Handbags','Backpacks','Wallets','Travel Bags','School Bags'
    ]),
    ('Health & Wellness', 110, array[
      'Vitamins & Supplements Placeholder Disabled','First Aid','Thermometers','Medical Accessories','Masks','Sanitizers','Wellness Devices','Massage Tools','Fitness Support'
    ]),
    ('Pet Supplies', 120, array[
      'Cat Food','Dog Food','Bird Food','Fish Food','Pet Treats','Pet Grooming','Pet Cleaning','Pet Toys','Pet Accessories','Litter & Waste'
    ]),
    ('Toys & Games', 130, array[
      'Baby Toys','Educational Toys','Action Figures','Dolls','Building Toys','Board Games','Puzzles','Outdoor Toys','Remote Control Toys','Arts & Crafts'
    ]),
    ('Stationery & Office', 140, array[
      'Pens & Pencils','Notebooks','Paper','Files & Folders','Desk Accessories','School Supplies','Office Supplies','Calculators','Labels & Tapes','Packaging Supplies'
    ]),
    ('Sports & Outdoors', 150, array[
      'Fitness Equipment','Exercise Accessories','Swimming Accessories','Football','Basketball','Cycling Accessories','Camping Accessories','Outdoor Gear','Sports Bottles','Sports Bags'
    ]),
    ('Automotive Accessories', 160, array[
      'Car Care','Car Cleaning','Car Accessories','Car Chargers','Phone Holders','Car Air Fresheners','Engine Oils','Tires Accessories','Emergency Tools'
    ]),
    ('Books & Media', 170, array[
      'Arabic Books','English Books','Children Books','Educational Books','Notebooks & Activity Books'
    ]),
    ('Flowers & Gifts', 180, array[
      'Flowers','Gift Sets','Greeting Cards','Gift Bags','Party Supplies','Balloons','Occasions'
    ]),
    ('Services & Digital', 190, array[
      'Gift Cards Placeholder Disabled','Digital Services Placeholder Disabled'
    ])
),
parent_upserts as (
  insert into public.categories (
    slug,
    name_en,
    name_ar,
    description_en,
    description_ar,
    parent_id,
    sort_order,
    is_active
  )
  select
    public.sinbad_taxonomy_slug(category_name),
    category_name,
    category_name,
    'Sinbad taxonomy parent category.',
    'Sinbad taxonomy parent category.',
    null,
    category_sort,
    true
  from taxonomy
  on conflict (slug) do update
  set
    name_en = excluded.name_en,
    name_ar = excluded.name_ar,
    parent_id = null,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now()
  returning id, slug
),
parent_lookup as (
  select
    t.category_name,
    t.category_sort,
    t.children,
    pu.id as parent_id,
    pu.slug as parent_slug
  from taxonomy t
  join parent_upserts pu
    on pu.slug = public.sinbad_taxonomy_slug(t.category_name)
),
child_rows as (
  select
    parent_id,
    parent_slug,
    child_name,
    ordinality::integer as child_sort,
    (
      child_name in (
        'Vitamins & Supplements Placeholder Disabled',
        'Gift Cards Placeholder Disabled',
        'Digital Services Placeholder Disabled'
      )
    ) as is_disabled_placeholder
  from parent_lookup
  cross join unnest(children) with ordinality as child(child_name, ordinality)
)
insert into public.categories (
  slug,
  name_en,
  name_ar,
  description_en,
  description_ar,
  parent_id,
  sort_order,
  is_active
)
select
  parent_slug || '-' || public.sinbad_taxonomy_slug(child_name),
  child_name,
  child_name,
  case
    when is_disabled_placeholder then 'Restricted placeholder. Keep disabled until policy and legal approval.'
    else 'Sinbad taxonomy subcategory.'
  end,
  case
    when is_disabled_placeholder then 'Restricted placeholder. Keep disabled until policy and legal approval.'
    else 'Sinbad taxonomy subcategory.'
  end,
  parent_id,
  child_sort,
  not is_disabled_placeholder
from child_rows
on conflict (slug) do update
set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  description_en = excluded.description_en,
  description_ar = excluded.description_ar,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

drop function public.sinbad_taxonomy_slug(text);
