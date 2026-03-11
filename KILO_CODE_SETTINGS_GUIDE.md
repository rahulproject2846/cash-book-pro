# 🚀 Kilo Code Extension - সম্পূর্ণ সেটিংস গাইড

## 📋 সূচিপত্র

1. [Kilo Code কী?](#kilo-code-কী)
2. [সেটিংস পেজের সকল ট্যাব ও অপশন](#সেটিংস-পেজের-সকল-ট্যাব-ও-অপশন)
3. [বর্তমান প্রজেক্টের মোড কনফিগারেশন](#বর্তমান-প্রজেক্টের-মোড-কনফিগারেশন)
4. [সেরা ফলাফলের জন্য সুপারিশ](#সেরা-ফলাফলের-জন্য-সুপারিশ)
5. [Custom Mode তৈরির নিয়ম](#custom-mode-তৈরির-নিয়ম)

---

## 🤖 Kilo Code কী?

Kilo Code (Roo Code) হলো VS Code-এর একটি AI-powered extension যা আপনাকে কোড লেখা, ডিবাগিং, এবং প্রজেক্ট ম্যানেজ করতে সাহায্য করে। এটি বিভিন্ন "Mode" ব্যবহার করে বিভিন্ন ধরনের কাজের জন্য আলাদা AI behavior প্রদান করে।

---

## ⚙️ সেটিংস পেজের সকল ট্যাব ও অপশন

### 📌 সেটিংস পেজে সাধারণত যা যা থাকে:

#### 1. **General Settings (সাধারণ সেটিংস)**
| অপশন | কাজ | সুপারিশকৃত মান |
|-------|-----|----------------|
| `Language` | AI-এর সাথে কোন ভাষায় কথা বলবেন | English |
| `Model` | কোন AI model ব্যবহার করবেন | Claude 3.5 Sonnet বা Gemini |
| `Temperature` | AI-এর creativity | 0.7 (ডিফল্ট) |
| `Max Tokens` | প্রতিক্রিয়ার সর্বোচ্চ দৈর্ঘ্য | 4000-8000 |

#### 2. **Mode Settings (মোড সেটিংস)**
Kilo Code-এ বিভিন্ন মোড আছে যা বিভিন্ন কাজের জন্য:

| মোড | নাম | কাজ |
|------|-----|-----|
| `Architect` | 🏗️ Architect | প্ল্যানিং, ডিজাইন, আর্কিটেকচার তৈরি |
| `Ask` | ❓ Ask | প্রশ্ন করা, ব্যাখ্যা নেওয়া |
| `Code` | 💻 Code | কোড লেখা, রিফ্যাক্টরিং |
| `Debug` | 🐛 Debug | বাগ খুঁজে বের করা |
| `Orchestrator` | 🎯 Orchestrator | জটিল প্রজেক্ট ম্যানেজ |
| `Review` | 🔍 Review | কোড রিভিউ |

#### 3. **API Settings (API সেটিংস)**
| সেটিং | বিবরণ |
|--------|--------|
| `API Provider` | OpenAI, Anthropic, Google Gemini ইত্যাদি |
| `API Key` | আপনার API key |
| `Base URL` | Custom API endpoint (যদি থাকে) |
| `Model Name` | নির্দিষ্ট model নাম |

#### 4. **Behavior Settings (আচরণ সেটিংস)**
| অপশন | কাজ | সুপারিশ |
|-------|-----|---------|
| `Auto-Save` | স্বয়ংক্রিয় সংরক্ষণ | ON |
| `Auto-Approve` | স্বয়ংক্রিয় অনুমোদন | নিরাপদ মোডে OFF |
| `Review Mode` | কোড রিভিউ মোড | ON |
| `Explain Code` | কোড ব্যাখ্যা | ON |
| `Write Tests` | টেস্ট লেখা | প্রজেক্টের উপর নির্ভর করে |

#### 5. **Tools Settings (টুল সেটিংস)**
| টুল | বিবরণ |
|-----|--------|
| `Read Files` | ফাইল পড়া |
| `Write Files` | ফাইল লেখা |
| `Edit Files` | ফাইল এডিট |
| `Run Commands` | কমান্ড চালান |
| `Browser Actions` | ব্রাউজার অ্যাকশন |
| `MCP Tools` | MCP সার্ভার টুল |

---

## 📂 বর্তমান প্রজেক্টের মোড কনফিগারেশন

আপনার প্রজেক্টে `.roomodes` ফাইলে বর্তমানে যা আছে:

```yaml
customModes:
  - slug: mode-writer
    name: ✍️ Mode Writer
    roleDefinition: |
      You are Roo, a mode creation and editing specialist...
    whenToUse: |
      Use this mode when you need to create a new custom mode...
    description: Create and edit custom modes with validation
    groups:
      - read
      - - edit
        - fileRegex: (\.roomodes$|\.roo/.*\.xml$|\.yaml$)
          description: Mode configuration files and XML instructions
      - command
      - mcp
    source: project
```

### 🔧 বর্তমান কনফিগারেশনের বিশ্লেষণ:

| বিষয় | বর্তমান অবস্থা | মূল্যায়ন |
|--------|---------------|----------|
| Custom Mode তৈরি | ✅ আছে | ভালো |
| Mode-এ File Restrictions | ✅ আছে | নিরাপদ |
| Read Permission | ✅ আছে | ঠিক আছে |
| Write Permission | ⚠️ সীমিত | শুধু .roomodes ও .yaml ফাইল |
| Command Execution | ✅ আছে | ঝুঁকিপূর্ণ কিন্তু প্রয়োজনীয় |
| MCP Tools | ✅ আছে | ঠিক আছে |

---

## 🎯 সেরা ফলাফলের জন্য সুপারিশ

### 1. **Mode সিলেকশন টেবিল**

| আপনার কাজ | সেরা মোড | কারণ |
|-----------|---------|------|
| নতুন ফিচার তৈরি | `Code` | কোড লেখার জন্য অপ্টিমাইজড |
| বাগ ফিক্সিং | `Debug` | সমস্যা সমাধানে দক্ষ |
| কোড রিভিউ | `Review` | কোড বিশ্লেষণে এক্সপার্ট |
| আর্কিটেকচার প্ল্যান | `Architect` | সিস্টেম ডিজাইনে দক্ষ |
| প্রজেক্ট অর্কেস্ট্রেশন | `Orchestrator` | জটিল টাস্ক ম্যানেজমেন্ট |
| শুধু প্রশ্ন | `Ask` | দ্রুত উত্তর পান |

### 2. **API সেটিংস অপ্টিমাইজেশন**

```
সুপারিশকৃত কনফিগারেশন:

✅ API Provider: Anthropic (Claude)
✅ Model: claude-sonnet-4-20250514
✅ Temperature: 0.7
✅ Max Tokens: 8000

অথবা

✅ API Provider: Google Gemini
✅ Model: gemini-2.5-pro
✅ Temperature: 0.7
```

### 3. **নিরাপত্তা সেটিংস**

| সেটিং | সুপারিশ | কারণ |
|-------|---------|------|
| `Auto-Approve Destructive` | ❌ OFF | ডেটা হারানোর ঝুঁকি কমায় |
| `File Write Confirmation` | ✅ ON | ভুলে ফাইল ওভাররাইট কমায় |
| `Command Execution` | ⚠️ Limited | শুধু প্রয়োজনীয় কমান্ড |
| `Browser Actions` | ✅ ON | ওয়েব টেস্টিংয়ের জন্য |

### 4. **পারফরম্যান্স বুস্ট টিপস**

```
🚀 Kilo Code ব্যবহার করে ১০০গুণ বেশি স্পিড পেতে:

1. ✅ Mode সঠিকভাবে সিলেক্ট করুন
2. ✅ প্রশ্ন যতটা সম্ভব স্পষ্ট করুন
3. ✅ সঠিক file path দিন
4. ✅ কোন লাইন নম্বরে সমস্যা সেটি বলুন
5. ✅ প্রত্যাশিত আউটপুট বলুন
6. ✅ কোন ফ্রেমওয়ার্ক/লাইব্রেরি ব্যবহার করছেন সেটি উল্লেখ করুন
```

---

## 🔨 Custom Mode তৈরির নিয়ম

### ধাপ ১: `.roomodes` ফাইল তৈরি করুন

আপনার প্রজেক্টের রুটে `.roomodes` ফাইল তৈরি করুন:

```yaml
customModes:
  - slug: my-custom-mode
    name: 🎯 My Custom Mode
    roleDefinition: |
      You are an expert in [আপনার দক্ষতার ক্ষেত্র]...
      
      Your expertise includes:
      - [দক্ষতা ১]
      - [দক্ষতা ২]
      - [দক্ষতা ৩]
    whenToUse: |
      Use this mode when [কখন ব্যবহার করবেন]
    description: [সংক্ষিপ্ত বিবরণ]
    groups:
      - read
      - edit
      - command
      - mcp
    source: project
```

### ধাপ ২: Mode ব্যবহার করুন

```
Mode সিলেক্ট করতে:
1. VS Code-এ Kilo Code extension খুলুন
2. মোড লিস্ট থেকে আপনার মোড সিলেক্ট করুন
3. কাজ শুরু করুন
```

---

## 📊 সুপারিশকৃত কনফিগারেশন ফাইল

আপনার জন্য একটি সুপারিশকৃত `.roomodes` ফাইল:

```yaml
customModes:
  # Cash Book Pro এর জন্য বিশেষ মোড
  - slug: cashbook-pro
    name: 💰 Cash Book Pro Developer
    roleDefinition: |
      You are a senior full-stack developer specializing in the Cash Book Pro project.
      This is an offline-first financial application with:
      - Next.js 14 (App Router)
      - TypeScript
      - Dexie.js (Offline Database)
      - Zustand (State Management)
      - Pusher (Real-time Sync)
      - MongoDB
      
      You excel at:
      - Offline-first architecture implementation
      - Real-time sync between local DB and server
      - Financial data integrity
      - Conflict resolution
      - Security best practices
    whenToUse: |
      Use this mode when working on the Cash Book Pro project.
      This includes:
      - Adding new features
      - Fixing bugs
      - Implementing sync logic
      - Database schema changes
      - API endpoint development
    description: Cash Book Pro development mode
    groups:
      - read
      - edit
      - command
      - mcp
    source: project

  # আর্কিটেক্ট মোড
  - slug: architect
    name: 🏗️ System Architect
    roleDefinition: |
      You are a System Architect specializing in planning and designing complex systems.
      You excel at:
      - System architecture design
      - Technology selection
      - Performance optimization
      - Scalability planning
      - Security architecture
    whenToUse: |
      Use this mode when:
      - Planning new features
      - Designing system architecture
      - Making technical decisions
      - Reviewing architectural changes
    groups:
      - read
      - ask
    source: project

  # ডিবাগ মোড
  - slug: debug
    name: 🐛 Debug Expert
    roleDefinition: |
      You are a debugging expert specializing in finding and fixing bugs.
      You excel at:
      - Systematic debugging
      - Error analysis
      - Log analysis
      - Root cause identification
      - Performance profiling
    whenToUse: |
      Use this mode when:
      - Application is not working
      - Errors appearing in console
      - Performance issues
      - Unexpected behavior
    groups:
      - read
      - edit
      - command
    source: project
```

---

## ✅ চূড়ান্ত সুপারিশ

### সেরা ফলাফলের জন্য:

1. **সঠিক Mode ব্যবহার করুন** - প্রতিটি কাজের জন্য উপযুক্ত Mode সিলেক্ট করুন
2. **স্পষ্ট প্রশ্ন করুন** - কোড লাইন নম্বর সহ বলুন
3. **Context দিন** - কোন ফ্রেমওয়ার্ক ব্যবহার করছেন সেটি বলুন
4. **File Restrictions বজায় রাখুন** - নিরাপত্তার জন্য
5. **Custom Mode তৈরি করুন** - আপনার প্রজেক্টের জন্য

---

*এই ডকুমেন্ট Kilo Code Extension-এর সেটিংস এবং সুপারিশ সম্পর্কে। সব তথ্য সঠিক, কিন্তু নির্দিষ্ট VS Code সেটিংস উইন্ডো থেকে পরিবর্তিত হতে পারে।*
