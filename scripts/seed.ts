import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function seed() {
  console.log("Seeding Shelf Coach demo data...");

  // Create task list
  const { data: taskList, error: listError } = await supabase
    .from("task_lists")
    .insert({ name: "Cafe Daily Checklist" })
    .select()
    .single();

  if (listError) {
    console.error("Failed to create task list:", listError.message);
    process.exit(1);
  }

  console.log("Created task list:", taskList.name);

  // Create tasks
  const tasks = [
    {
      task_list_id: taskList.id,
      title: "Food Display Refill",
      text_guide:
        "Check the food display case. All trays should be at least 70% full. Replace any items that look stale or discolored. Arrange items neatly in rows.",
      sort_order: 1,
    },
    {
      task_list_id: taskList.id,
      title: "Table Area Cleanup",
      text_guide:
        "All tables should be wiped clean. Chairs pushed in and aligned. No trash or used napkins on surfaces. Condiment holders refilled and organized.",
      sort_order: 2,
    },
    {
      task_list_id: taskList.id,
      title: "Lounge Sofa Organization",
      text_guide:
        "Cushions fluffed and positioned evenly. Throw pillows arranged symmetrically. No personal items left on sofas. Side tables cleared and wiped.",
      sort_order: 3,
    },
  ];

  const { data: createdTasks, error: taskError } = await supabase
    .from("tasks")
    .insert(tasks)
    .select();

  if (taskError) {
    console.error("Failed to create tasks:", taskError.message);
    process.exit(1);
  }

  console.log(`Created ${createdTasks.length} tasks:`);
  for (const t of createdTasks) {
    console.log(`  - ${t.title}`);
  }

  console.log("\nSeed complete!");
  console.log("Next steps:");
  console.log("  1. Upload expected images via the Dashboard");
  console.log("  2. Set up Slack/Telegram/WhatsApp bot credentials in .env");
  console.log("  3. Run pnpm dev and test the flow");
}

seed().catch(console.error);
