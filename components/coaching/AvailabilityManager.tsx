"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCoachingAvailability } from "@/utils/hooks/useCoachingAvailability";
import {
  CoachingSchedule,
  CoachingScheduleSchema,
  WeekDay,
} from "@/utils/types/coaching";
import { cn } from "@/utils/cn";

const TIMEZONES = Intl.supportedValuesOf("timeZone");

export function AvailabilityManager() {
  const {
    schedules,
    isLoading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useCoachingAvailability();

  const form = useForm<CoachingSchedule>({
    resolver: zodResolver(CoachingScheduleSchema),
    defaultValues: {
      name: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isDefault: false,
      active: true,
      defaultDuration: 60,
      minimumDuration: 30,
      maximumDuration: 120,
      allowCustomDuration: true,
      bufferBefore: 0,
      bufferAfter: 0,
      rules: {
        weeklySchedule: {
          MONDAY: [],
          TUESDAY: [],
          WEDNESDAY: [],
          THURSDAY: [],
          FRIDAY: [],
          SATURDAY: [],
          SUNDAY: [],
        },
        breaks: [],
      },
      calendlyEnabled: false,
      zoomEnabled: false,
    },
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const onSubmit = async (data: CoachingSchedule) => {
    if (data.id) {
      await updateSchedule(data.id, data);
    } else {
      await createSchedule(data);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Availability Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schedules" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schedules">My Schedules</TabsTrigger>
              <TabsTrigger value="new">Create New</TabsTrigger>
            </TabsList>

            <TabsContent value="schedules" className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{schedule.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => form.reset(schedule)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Status:</span>
                        <span
                          className={cn(
                            "text-sm",
                            schedule.active
                              ? "text-green-600"
                              : "text-yellow-600"
                          )}
                        >
                          {schedule.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Default:</span>
                        <span>{schedule.isDefault ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Timezone:</span>
                        <span>{schedule.timezone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="new">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIMEZONES.map((tz) => (
                                <SelectItem key={tz} value={tz}>
                                  {tz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="defaultDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={15}
                              max={240}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minimumDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={15}
                              max={240}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maximumDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={15}
                              max={240}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="bufferBefore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer Before (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={60}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bufferAfter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer After (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={60}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="allowCustomDuration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Allow Custom Duration</FormLabel>
                            <FormDescription>
                              Let clients choose custom session duration
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Make this schedule available for booking
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Default Schedule</FormLabel>
                            <FormDescription>
                              Use this as your default availability
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {form.getValues("id") ? "Update" : "Create"} Schedule
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 