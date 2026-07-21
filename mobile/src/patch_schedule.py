with open('screens/ScheduleScreen.tsx', 'rb') as f:\n    content = f.read().decode('utf-8')\n\nold1 = "import { festivalConfig } from '../config/festival.config';"
new1 = "import { festivalConfig } from '../config/festival.config';\nimport { useNow } from '../contexts/FakeClockContext';"
content = content.replace(old1, new1, 1)

old2 = "  // Current time ticker for countdown badges\r\n  const [now, setNow] = useState<number>(Date.now());"
new2 = "  // Current time — reads from FakeClockContext (supports admin fake-clock override)\r\n  const now = useNow();"
content = content.replace(old2, new2, 1)

old3 = "  // Update current time every minute to refresh countdowns\r\n  useEffect(() => {\r\n    const interval = setInterval(() => setNow(Date.now()), 60000);\r\n    return () => clearInterval(interval);\r\n  }, []);\r\n\r\n"
new3 = ""
content = content.replace(old3, new3, 1)

with open('screens/ScheduleScreen.tsx', 'wb') as f:\n    f.write(content.encode('utf-8'))\nprint("done")
